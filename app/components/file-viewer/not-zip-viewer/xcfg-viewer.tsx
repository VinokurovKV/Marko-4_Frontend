// React
import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import pako from 'pako'

// Пропсы компонента
interface XcfgFileViewerProps {
  xcfgBlob?: Blob | null
  fileName?: string
  isDarkMode?: boolean
  timestampPrecision?: 'milliseconds' | 'microseconds' | 'nanoseconds'
  debugMode?: boolean
  enableDecompression?: boolean
  onLoad?: (packetCount: number) => void
  onError?: (error: Error) => void
}

interface XcfgPacket {
  index: number
  seconds: bigint
  nanoseconds: number
  timestamp: number
  source: string
  destination: string
  protocol: string
  length: number
  info: string
  rawData?: Uint8Array
}

interface XcfgFileData {
  version: string
  hasNanos: boolean
  packets: XcfgPacket[]
  captureInfo: {
    startTime: number
    endTime: number
    interface: string
    packetCount: number
  }
  metadata?: {
    compression?: string
    decompressedSize?: number
    warnings?: string[]
    isTextFormat?: boolean
    textContent?: string
  }
}

// Функция для определения формата сжатия
const detectCompressionType = async (
  blob: Blob
): Promise<'gzip' | 'zlib' | 'raw-deflate' | 'none'> => {
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer())

  if (bytes.length < 2) return 'none'

  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return 'gzip'
  }

  if (
    bytes[0] === 0x78 &&
    (bytes[1] === 0x01 || bytes[1] === 0x9c || bytes[1] === 0xda)
  ) {
    return 'zlib'
  }

  return 'none'
}

// Расширенная декомпрессия
const smartDecompress = async (
  blob: Blob,
  debugMode: boolean
): Promise<Blob> => {
  const bytes = new Uint8Array(await blob.slice(0, 10).arrayBuffer())

  if (debugMode) {
    console.log(
      'First bytes:',
      Array.from(bytes)
        .map((b) => '0x' + b.toString(16))
        .join(' ')
    )
  }

  // Проверяем, не является ли файл уже распакованным
  for (let i = 0; i < bytes.length - 4; i++) {
    if (
      bytes[i] === 0x58 &&
      bytes[i + 1] === 0x43 &&
      bytes[i + 2] === 0x46 &&
      bytes[i + 3] === 0x47
    ) {
      if (debugMode) console.log('File already decompressed (XCFG found)')
      return blob
    }
  }

  // Пробуем pako
  try {
    const compressedBytes = new Uint8Array(await blob.arrayBuffer())

    const decompressors = [
      { name: 'zlib inflate', fn: () => pako.inflate(compressedBytes) },
      {
        name: 'raw inflate',
        fn: () => pako.inflate(compressedBytes, { raw: true })
      },
      { name: 'gzip ungzip', fn: () => pako.ungzip(compressedBytes) }
    ]

    for (const dec of decompressors) {
      try {
        const result = dec.fn()
        if (result && result.length > 0) {
          if (debugMode)
            console.log(`✅ Pako ${dec.name} succeeded, size: ${result.length}`)
          return new Blob([result], { type: 'application/octet-stream' })
        }
      } catch {
        if (debugMode) console.log(`❌ Pako ${dec.name} failed`)
      }
    }
  } catch (error) {
    console.warn('Pako decompression error:', error)
  }

  return blob
}

// Парсер текстового формата XCFG
const parseTextFormat = (
  text: string,
  debugMode: boolean
): Promise<XcfgFileData> => {
  const packets: XcfgPacket[] = []
  const lines = text.split('\n')

  if (debugMode) {
    console.log('Parsing text format, lines:', lines.length)
    console.log('First 10 lines:', lines.slice(0, 10))
  }

  // Пробуем парсить как JSON
  try {
    const jsonData: unknown = JSON.parse(text)
    if (debugMode) console.log('Parsed as JSON successfully')

    // Если JSON содержит массив пакетов
    if (Array.isArray(jsonData)) {
      for (let i = 0; i < jsonData.length; i++) {
        const pkt = jsonData[i] as Record<string, unknown>
        packets.push({
          index: i,
          seconds: BigInt(
            typeof pkt.timestamp === 'number' ? pkt.timestamp : i
          ),
          nanoseconds:
            typeof pkt.nanoseconds === 'number' ? pkt.nanoseconds : 0,
          timestamp:
            (typeof pkt.timestamp === 'number' ? pkt.timestamp : i) * 1000,
          source: typeof pkt.source === 'string' ? pkt.source : 'unknown',
          destination:
            typeof pkt.destination === 'string' ? pkt.destination : 'unknown',
          protocol: typeof pkt.protocol === 'string' ? pkt.protocol : 'unknown',
          length: typeof pkt.length === 'number' ? pkt.length : 0,
          info: typeof pkt.info === 'string' ? pkt.info : '',
          rawData: pkt.rawData instanceof Uint8Array ? pkt.rawData : undefined
        })
      }
    }
  } catch {
    if (debugMode) console.log('Not JSON format')
  }

  // Если не JSON, пробуем парсить как CSV или TSV
  if (packets.length === 0) {
    const lines2 = lines.filter((l) => l.trim() && !l.startsWith('#'))
    if (lines2.length > 0) {
      const firstLine = lines2[0]
      const separator = firstLine.includes(',')
        ? ','
        : firstLine.includes('\t')
          ? '\t'
          : null

      if (separator) {
        const headers = firstLine
          .split(separator)
          .map((h) => h.trim().toLowerCase())
        const timestampIdx = headers.findIndex(
          (h) => h.includes('timestamp') || h.includes('time')
        )
        const sourceIdx = headers.findIndex(
          (h) => h.includes('source') || h.includes('src')
        )
        const destIdx = headers.findIndex(
          (h) =>
            h.includes('destination') || h.includes('dst') || h.includes('dest')
        )
        const protocolIdx = headers.findIndex(
          (h) => h.includes('protocol') || h.includes('proto')
        )
        const lengthIdx = headers.findIndex(
          (h) => h.includes('length') || h.includes('size')
        )
        const infoIdx = headers.findIndex(
          (h) => h.includes('info') || h.includes('details')
        )

        for (let i = 1; i < lines2.length; i++) {
          const values = lines2[i].split(separator).map((v) => v.trim())
          if (values.length >= headers.length) {
            packets.push({
              index: i - 1,
              seconds: BigInt(i - 1),
              nanoseconds: 0,
              timestamp:
                timestampIdx >= 0
                  ? parseFloat(values[timestampIdx]) * 1000
                  : (i - 1) * 1000,
              source: sourceIdx >= 0 ? values[sourceIdx] : 'unknown',
              destination: destIdx >= 0 ? values[destIdx] : 'unknown',
              protocol: protocolIdx >= 0 ? values[protocolIdx] : 'unknown',
              length: lengthIdx >= 0 ? parseInt(values[lengthIdx]) || 0 : 0,
              info: infoIdx >= 0 ? values[infoIdx] : '',
              rawData: undefined
            })
          }
        }
      }
    }
  }

  // Если ничего не подошло, создаем один пакет с текстом
  if (packets.length === 0) {
    packets.push({
      index: 0,
      seconds: BigInt(0),
      nanoseconds: 0,
      timestamp: Date.now(),
      source: 'text',
      destination: 'file',
      protocol: 'TEXT',
      length: text.length,
      info: text.substring(0, 200),
      rawData: new TextEncoder().encode(text)
    })
  }

  return Promise.resolve({
    version: 'text.1.0',
    hasNanos: false,
    packets,
    captureInfo: {
      startTime: packets[0]?.timestamp || 0,
      endTime: packets[packets.length - 1]?.timestamp || 0,
      interface: 'text-input',
      packetCount: packets.length
    },
    metadata: {
      isTextFormat: true,
      textContent: text.substring(0, 1000)
    }
  })
}

// Основной компонент
export const XcfgFileViewer: React.FC<XcfgFileViewerProps> = ({
  xcfgBlob,
  fileName,
  isDarkMode = false,
  timestampPrecision = 'microseconds',
  debugMode = false,
  enableDecompression = true,
  onLoad,
  onError
}) => {
  const [fileData, setFileData] = useState<XcfgFileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [decompressing, setDecompressing] = useState(false)
  const [selectedPacket, setSelectedPacket] = useState<XcfgPacket | null>(null)
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [expandedPackets, setExpandedPackets] = useState<Set<number>>(new Set())
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [showDebug, setShowDebug] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Диагностика файла
  const diagnoseFile = useCallback(
    async (blob: Blob): Promise<string> => {
      const bytes = new Uint8Array(await blob.slice(0, 256).arrayBuffer())

      let info = '📊 File Diagnostics:\n'
      info += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      info += `File name: ${fileName || 'unknown'}\n`
      info += `File size: ${blob.size.toLocaleString()} bytes (${(blob.size / 1024).toFixed(2)} KB)\n\n`

      info += `🔍 First 64 bytes (hex):\n`
      for (let i = 0; i < Math.min(64, bytes.length); i += 16) {
        const hex = Array.from(bytes.slice(i, i + 16))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(' ')
        const ascii = Array.from(bytes.slice(i, i + 16))
          .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
          .join('')
        info += `${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48, ' ')} ${ascii}\n`
      }

      // Анализ ZLIB заголовка
      if (bytes[0] === 0x78) {
        info += `\n📦 ZLIB Header Analysis:\n`
        const cm = bytes[0] & 0x0f
        const cinfo = (bytes[0] >> 4) & 0x0f
        const fcheck = ((bytes[0] << 8) + bytes[1]) % 31 === 0

        info += `  CM (compression method): ${cm} (${cm === 8 ? 'DEFLATE' : 'unknown'})\n`
        info += `  CINFO (window size): ${cinfo} (${Math.pow(2, cinfo + 8)} bytes)\n`
        info += `  FCHECK valid: ${fcheck ? '✅ yes' : '❌ no'}\n`

        const flevel = (bytes[1] >> 6) & 0x03
        info += `  FLEVEL: ${flevel} (${flevel === 3 ? 'max compression' : flevel === 2 ? 'default' : 'fast'})\n`
      }

      // Пробуем декомпрессию для анализа
      if (enableDecompression) {
        info += `\n🔧 Attempting decompression for analysis...\n`
        try {
          const decompressed = await smartDecompress(blob, false)
          if (decompressed.size !== blob.size) {
            info += `  ✅ Decompression successful: ${blob.size} -> ${decompressed.size} bytes\n`

            const decompBytes = new Uint8Array(
              await decompressed.slice(0, 200).arrayBuffer()
            )
            info += `\n  First 64 bytes after decompression:\n`
            for (let i = 0; i < Math.min(64, decompBytes.length); i += 16) {
              const hex = Array.from(decompBytes.slice(i, i + 16))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join(' ')
              const ascii = Array.from(decompBytes.slice(i, i + 16))
                .map((b) =>
                  b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'
                )
                .join('')
              info += `  ${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48, ' ')} ${ascii}\n`
            }

            // Пробуем интерпретировать как текст
            const textContent = new TextDecoder().decode(decompBytes)
            if (textContent.trim().length > 0) {
              info += `\n  📄 Decompressed content appears to be text:\n`
              info += `  ${textContent.substring(0, 500).replace(/\n/g, '\\n').replace(/\r/g, '\\r')}\n`
            }
          } else {
            info += `  ⚠️ File size unchanged after decompression attempt\n`
          }
        } catch (error) {
          info += `  ❌ Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`
        }
      }

      return info
    },
    [fileName, enableDecompression]
  )

  // Парсинг .xcfg файла
  const parseXcfgFile = useCallback(
    async (blob: Blob): Promise<XcfgFileData> => {
      let processedBlob = blob
      const metadata: XcfgFileData['metadata'] = { warnings: [] }

      // Автоматическая декомпрессия
      if (enableDecompression) {
        const compressionType = await detectCompressionType(blob)

        if (compressionType !== 'none') {
          if (debugMode)
            console.log(`📦 Detected ${compressionType}, decompressing...`)

          try {
            processedBlob = await smartDecompress(blob, debugMode)
            metadata.compression = compressionType
            metadata.decompressedSize = processedBlob.size

            if (debugMode) {
              console.log(
                `✅ Decompressed: ${blob.size} -> ${processedBlob.size} bytes`
              )
            }
          } catch (error) {
            throw new Error(
              `Failed to decompress: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        }
      }

      // Парсинг
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = async (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer
            const dataView = new DataView(buffer)
            const bytes = new Uint8Array(buffer)

            if (debugMode) {
              console.group('📄 Parsing .xcfg file')
              console.log('File size:', buffer.byteLength, 'bytes')
            }

            // Поиск XCFG заголовка
            let magicOffset = -1
            const searchLimit = Math.min(1024, buffer.byteLength - 4)

            for (let offset = 0; offset < searchLimit; offset++) {
              if (
                bytes[offset] === 0x58 &&
                bytes[offset + 1] === 0x43 &&
                bytes[offset + 2] === 0x46 &&
                bytes[offset + 3] === 0x47
              ) {
                magicOffset = offset
                break
              }
            }

            // Если XCFG не найден, пробуем интерпретировать как текст
            if (magicOffset === -1) {
              const textContent = new TextDecoder().decode(bytes)

              // Проверяем, выглядит ли как текстовый формат
              if (
                textContent.trim().length > 0 &&
                (textContent.includes('\n') || textContent.includes(','))
              ) {
                if (debugMode)
                  console.log(
                    'No XCFG header, attempting to parse as text format'
                  )
                const textData = await parseTextFormat(textContent, debugMode)
                resolve(textData)
                return
              } else {
                throw new Error(
                  `"XCFG" header not found. Decompressed data (${buffer.byteLength} bytes) does not appear to be valid XCFG format.`
                )
              }
            }

            if (debugMode)
              console.log('✅ Magic header found at offset:', magicOffset)

            // Чтение версии
            const majorVersion = dataView.getUint8(magicOffset + 4)
            const minorVersion = dataView.getUint8(magicOffset + 5)
            const version = `${majorVersion}.${minorVersion}`

            if (debugMode) console.log('Version:', version)

            // Чтение флагов
            let hasNanos = false
            if (majorVersion >= 1) {
              const flags = dataView.getUint16(magicOffset + 6, true)
              hasNanos = (flags & 0x0001) !== 0
              if (debugMode) console.log('Has nanoseconds:', hasNanos)
            }

            // Количество пакетов
            const packetCount = dataView.getUint32(magicOffset + 8, true)
            if (debugMode) console.log('Packet count:', packetCount)

            // Чтение информации о захвате
            let offset = magicOffset + 12
            let interfaceName = 'unknown'

            if (majorVersion >= 1 && offset + 2 <= buffer.byteLength) {
              const interfaceNameLength = dataView.getUint16(offset, true)
              offset += 2
              if (
                interfaceNameLength > 0 &&
                interfaceNameLength < 1024 &&
                offset + interfaceNameLength <= buffer.byteLength
              ) {
                interfaceName = new TextDecoder().decode(
                  buffer.slice(offset, offset + interfaceNameLength)
                )
                offset += interfaceNameLength
              }
            }

            // Чтение пакетов
            const packets: XcfgPacket[] = []

            for (
              let i = 0;
              i < packetCount && offset < buffer.byteLength;
              i++
            ) {
              try {
                let seconds: bigint
                let nanoseconds: number
                let jsTimestamp: number

                if (majorVersion >= 2 && offset + 12 <= buffer.byteLength) {
                  seconds = dataView.getBigUint64(offset, true)
                  nanoseconds = dataView.getUint32(offset + 8, true)
                  jsTimestamp = Number(seconds) * 1000 + nanoseconds / 1_000_000
                  offset += 12
                } else if (
                  majorVersion >= 1 &&
                  offset + 8 <= buffer.byteLength
                ) {
                  const timestampDouble = dataView.getFloat64(offset, true)
                  const secondsDouble = Math.floor(timestampDouble)
                  nanoseconds = Math.floor(
                    (timestampDouble - secondsDouble) * 1_000_000_000
                  )
                  seconds = BigInt(secondsDouble)
                  jsTimestamp = timestampDouble * 1000
                  offset += 8
                } else {
                  break
                }

                if (offset + 12 > buffer.byteLength) break

                const srcLength = dataView.getUint16(offset, true)
                const dstLength = dataView.getUint16(offset + 2, true)
                const protocolLength = dataView.getUint16(offset + 4, true)
                const infoLength = dataView.getUint16(offset + 6, true)
                const dataLength = dataView.getUint32(offset + 8, true)

                let innerOffset = offset + 12

                const source =
                  srcLength > 0 && innerOffset + srcLength <= buffer.byteLength
                    ? new TextDecoder().decode(
                        buffer.slice(innerOffset, innerOffset + srcLength)
                      )
                    : ''
                innerOffset += srcLength

                const destination =
                  dstLength > 0 && innerOffset + dstLength <= buffer.byteLength
                    ? new TextDecoder().decode(
                        buffer.slice(innerOffset, innerOffset + dstLength)
                      )
                    : ''
                innerOffset += dstLength

                const protocol =
                  protocolLength > 0 &&
                  innerOffset + protocolLength <= buffer.byteLength
                    ? new TextDecoder().decode(
                        buffer.slice(innerOffset, innerOffset + protocolLength)
                      )
                    : 'unknown'
                innerOffset += protocolLength

                const info =
                  infoLength > 0 &&
                  innerOffset + infoLength <= buffer.byteLength
                    ? new TextDecoder().decode(
                        buffer.slice(innerOffset, innerOffset + infoLength)
                      )
                    : ''
                innerOffset += infoLength

                let rawData: Uint8Array | undefined
                if (
                  dataLength > 0 &&
                  innerOffset + dataLength <= buffer.byteLength
                ) {
                  rawData = new Uint8Array(
                    buffer.slice(innerOffset, innerOffset + dataLength)
                  )
                }

                packets.push({
                  index: i,
                  seconds,
                  nanoseconds,
                  timestamp: jsTimestamp,
                  source: source || 'N/A',
                  destination: destination || 'N/A',
                  protocol: protocol || 'unknown',
                  length: dataLength,
                  info: info || 'No additional info',
                  rawData
                })

                offset = innerOffset + dataLength
              } catch (packetError) {
                if (debugMode)
                  console.warn(`Error parsing packet ${i}:`, packetError)
                metadata.warnings?.push(`Failed to parse packet ${i}`)
                break
              }
            }

            if (debugMode) {
              console.log(`✅ Successfully parsed ${packets.length} packets`)
              console.groupEnd()
            }

            resolve({
              version,
              hasNanos,
              packets,
              captureInfo: {
                startTime: packets[0]?.timestamp || 0,
                endTime: packets[packets.length - 1]?.timestamp || 0,
                interface: interfaceName,
                packetCount: packets.length
              },
              metadata
            })
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)))
          }
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsArrayBuffer(processedBlob)
      })
    },
    [debugMode, enableDecompression]
  )

  // Загрузка файла
  useEffect(() => {
    if (!xcfgBlob) {
      setFileData(null)
      setDebugInfo('')
      return
    }

    const loadFile = async (): Promise<void> => {
      setLoading(true)
      setDecompressing(true)
      setShowDebug(false)

      try {
        if (debugMode) {
          const diagInfo = await diagnoseFile(xcfgBlob)
          setDebugInfo(diagInfo)
          setShowDebug(true)
        }

        const data = await parseXcfgFile(xcfgBlob)
        setFileData(data)
        setCurrentPage(1)
        setSelectedPacket(null)
        setExpandedPackets(new Set())
        onLoad?.(data.packets.length)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        onError?.(err)
        console.error('Error:', err)

        if (debugMode) {
          setDebugInfo((prev) => prev + `\n\n❌ ERROR: ${err.message}\n`)
          setShowDebug(true)
        }
      } finally {
        setLoading(false)
        setDecompressing(false)
      }
    }

    void loadFile()
  }, [xcfgBlob, parseXcfgFile, diagnoseFile, debugMode, onLoad, onError])

  // Форматирование времени
  const formatTimestamp = useCallback(
    (packet: XcfgPacket): string => {
      const date = new Date(packet.timestamp)
      const dateStr = date.toLocaleDateString()
      const timeStr = date.toLocaleTimeString()
      const nanosStr = packet.nanoseconds.toString().padStart(9, '0')

      switch (timestampPrecision) {
        case 'nanoseconds':
          return `${dateStr} ${timeStr}.${nanosStr}`
        case 'microseconds':
          return `${dateStr} ${timeStr}.${nanosStr.substring(0, 3)}`
        default:
          return `${dateStr} ${timeStr}.${date.getMilliseconds().toString().padStart(3, '0')}`
      }
    },
    [timestampPrecision]
  )

  const getFullTimestamp = useCallback((packet: XcfgPacket): string => {
    const date = new Date(packet.timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}.${packet.nanoseconds.toString().padStart(9, '0')}`
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getProtocolColor = (protocol: string) => {
    const colors: Record<string, string> = {
      TCP: '#4CAF50',
      UDP: '#2196F3',
      HTTP: '#FF9800',
      HTTPS: '#F44336',
      DNS: '#9C27B0',
      ICMP: '#00BCD4',
      ARP: '#795548',
      DHCP: '#8BC34A',
      TLS: '#E91E63',
      SSH: '#009688',
      FTP: '#FF5722',
      SMTP: '#673AB7',
      TEXT: '#9E9E9E'
    }
    return colors[protocol.toUpperCase()] || '#9E9E9E'
  }

  const renderHexDump = (data: Uint8Array) => {
    const lines = []
    for (let i = 0; i < data.length; i += 16) {
      const chunk = data.slice(i, i + 16)
      const hex = Array.from(chunk)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
      const ascii = Array.from(chunk)
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join('')
      lines.push(
        <div key={i} className="hex-line">
          <span className="hex-offset">{i.toString(16).padStart(8, '0')}</span>
          <span className="hex-bytes">{hex.padEnd(48, ' ')}</span>
          <span className="hex-ascii">{ascii}</span>
        </div>
      )
    }
    return <div className="hex-dump">{lines}</div>
  }

  const togglePacketExpansion = (packetIndex: number) => {
    setExpandedPackets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(packetIndex)) newSet.delete(packetIndex)
      else newSet.add(packetIndex)
      return newSet
    })
  }

  const filteredPackets =
    fileData?.packets.filter((packet) => {
      if (!filterText) return true
      const searchLower = filterText.toLowerCase()
      return (
        packet.source.toLowerCase().includes(searchLower) ||
        packet.destination.toLowerCase().includes(searchLower) ||
        packet.protocol.toLowerCase().includes(searchLower) ||
        packet.info.toLowerCase().includes(searchLower)
      )
    }) || []

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPackets = filteredPackets.slice(
    indexOfFirstItem,
    indexOfLastItem
  )
  const totalPages = Math.ceil(filteredPackets.length / itemsPerPage)

  if (loading || decompressing) {
    return (
      <div className={`xcfg-viewer ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{decompressing ? 'Decompressing file...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`xcfg-viewer ${isDarkMode ? 'dark' : 'light'}`}
    >
      <div className="viewer-header">
        <div className="file-info">
          <h3>{fileName || 'XCFG File Viewer'}</h3>
          {fileData && (
            <div className="file-metadata">
              <span>Version: {fileData.version}</span>
              {fileData.hasNanos && (
                <span className="badge-nanos">⚡ Nanosecond precision</span>
              )}
              {fileData.metadata?.compression && (
                <span className="badge-compressed">
                  📦 Decompressed ({fileData.metadata.compression})
                </span>
              )}
              {fileData.metadata?.isTextFormat && (
                <span className="badge-text">📄 Text format</span>
              )}
              <span>Packets: {fileData.captureInfo.packetCount}</span>
              <span>Interface: {fileData.captureInfo.interface}</span>
              {fileData.metadata?.warnings &&
                fileData.metadata.warnings.length > 0 && (
                  <span className="badge-warning">
                    ⚠️ {fileData.metadata.warnings.length} warnings
                  </span>
                )}
            </div>
          )}
        </div>
        {debugMode && (
          <button
            className="debug-btn"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        )}
      </div>

      {showDebug && debugInfo && (
        <div className="debug-panel">
          <pre className="debug-content">{debugInfo}</pre>
        </div>
      )}

      {fileData && fileData.packets.length > 0 ? (
        <>
          <div className="filter-panel">
            <input
              type="text"
              placeholder="Filter packets (source, destination, protocol, info)..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value)
                setCurrentPage(1)
              }}
              className="filter-input"
            />
            <div className="stats">
              Showing {filteredPackets.length} of {fileData.packets.length}{' '}
              packets
            </div>
            <div className="precision-selector">
              <label>Precision:</label>
              <select
                value={timestampPrecision}
                onChange={(e) => {
                  const newPrecision = e.target
                    .value as typeof timestampPrecision
                  console.log('Precision changed to:', newPrecision)
                }}
              >
                <option value="milliseconds">Milliseconds</option>
                <option value="microseconds">Microseconds</option>
                <option value="nanoseconds">Nanoseconds</option>
              </select>
            </div>
          </div>

          <div className="packets-table-container">
            <table className="packets-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                  <th>Length</th>
                  <th>Info</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentPackets.map((packet) => (
                  <React.Fragment key={packet.index}>
                    <tr
                      className={`packet-row ${selectedPacket?.index === packet.index ? 'selected' : ''}`}
                      onClick={() => setSelectedPacket(packet)}
                    >
                      <td>{packet.index + 1}</td>
                      <td>
                        <div
                          className="timestamp-cell"
                          title={getFullTimestamp(packet)}
                        >
                          {formatTimestamp(packet)}
                        </div>
                      </td>
                      <td>{packet.source}</td>
                      <td>{packet.destination}</td>
                      <td>
                        <span
                          className="protocol-badge"
                          style={{
                            backgroundColor: getProtocolColor(packet.protocol)
                          }}
                        >
                          {packet.protocol}
                        </span>
                      </td>
                      <td>{formatSize(packet.length)}</td>
                      <td className="info-cell">{packet.info}</td>
                      <td>
                        {packet.rawData && (
                          <button
                            className="expand-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePacketExpansion(packet.index)
                            }}
                          >
                            {expandedPackets.has(packet.index) ? '▼' : '▶'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedPackets.has(packet.index) && packet.rawData && (
                      <tr className="expanded-row">
                        <td colSpan={8}>
                          <div className="packet-details">
                            <div className="detail-section">
                              <h4>
                                Raw Data (
                                {formatSize(packet.rawData.byteLength)})
                              </h4>
                              {renderHexDump(packet.rawData)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}

          {selectedPacket && (
            <div className="details-panel">
              <div className="details-header">
                <h4>Packet #{selectedPacket.index + 1} Details</h4>
                <button
                  onClick={() => setSelectedPacket(null)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <div className="details-content">
                <div className="detail-group">
                  <div className="detail-row">
                    <span className="detail-label">Timestamp:</span>
                    <span className="detail-value">
                      {getFullTimestamp(selectedPacket)}
                      <br />
                      <small className="detail-sub">
                        Seconds: {selectedPacket.seconds.toString()} |
                        Nanoseconds: {selectedPacket.nanoseconds}
                      </small>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Source:</span>
                    <span className="detail-value">
                      {selectedPacket.source}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Destination:</span>
                    <span className="detail-value">
                      {selectedPacket.destination}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Protocol:</span>
                    <span className="detail-value">
                      <span
                        className="protocol-badge"
                        style={{
                          backgroundColor: getProtocolColor(
                            selectedPacket.protocol
                          )
                        }}
                      >
                        {selectedPacket.protocol}
                      </span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Length:</span>
                    <span className="detail-value">
                      {formatSize(selectedPacket.length)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Info:</span>
                    <span className="detail-value info-text">
                      {selectedPacket.info}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : fileData && fileData.packets.length === 0 ? (
        <div className="empty-state">
          <p>⚠️ File contains no packets</p>
          {fileData.metadata?.warnings?.map((w, i) => (
            <p key={i} className="warning-text">
              {w}
            </p>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No .xcfg file loaded</p>
          <p className="hint">
            Please select a valid .xcfg file to display packet data
          </p>
        </div>
      )}

      <style>{`
        .xcfg-viewer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', monospace;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: ${isDarkMode ? '#1e1e1e' : '#ffffff'};
          color: ${isDarkMode ? '#d4d4d4' : '#333333'};
          position: relative;
        }

        .viewer-header {
          padding: 16px 20px;
          border-bottom: 1px solid ${isDarkMode ? '#404040' : '#e0e0e0'};
          background: ${isDarkMode ? '#252526' : '#f8f9fa'};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .file-info h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 500;
        }

        .file-metadata {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: ${isDarkMode ? '#9e9e9e' : '#666666'};
          flex-wrap: wrap;
          align-items: center;
        }

        .badge-nanos, .badge-compressed, .badge-warning, .badge-text {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-nanos {
          background: ${isDarkMode ? '#0e639c' : '#e3f2fd'};
          color: ${isDarkMode ? '#ffffff' : '#1976d2'};
        }

        .badge-compressed {
          background: ${isDarkMode ? '#6c4a1f' : '#fff3e0'};
          color: ${isDarkMode ? '#ffb74d' : '#f57c00'};
        }

        .badge-text {
          background: ${isDarkMode ? '#4a4a4a' : '#e8e8e8'};
          color: ${isDarkMode ? '#ffffff' : '#333333'};
        }

        .badge-warning {
          background: ${isDarkMode ? '#8a2e2e' : '#ffebee'};
          color: ${isDarkMode ? '#ef9a9a' : '#c62828'};
        }

        .debug-btn {
          padding: 6px 12px;
          border: 1px solid ${isDarkMode ? '#404040' : '#d0d0d0'};
          background: ${isDarkMode ? '#3c3c3c' : '#ffffff'};
          color: inherit;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .debug-btn:hover {
          background: ${isDarkMode ? '#4c4c4c' : '#f0f0f0'};
        }

        .debug-panel {
          border-bottom: 1px solid ${isDarkMode ? '#404040' : '#e0e0e0'};
          background: ${isDarkMode ? '#1e1e1e' : '#f5f5f5'};
          max-height: 400px;
          overflow: auto;
        }

        .debug-content {
          margin: 0;
          padding: 12px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          white-space: pre-wrap;
          color: ${isDarkMode ? '#d4d4d4' : '#333333'};
        }

        .filter-panel {
          padding: 12px 20px;
          border-bottom: 1px solid ${isDarkMode ? '#404040' : '#e0e0e0'};
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          background: ${isDarkMode ? '#252526' : '#ffffff'};
        }

        .filter-input {
          flex: 1;
          min-width: 200px;
          padding: 8px 12px;
          border: 1px solid ${isDarkMode ? '#404040' : '#d0d0d0'};
          border-radius: 4px;
          background: ${isDarkMode ? '#3c3c3c' : '#ffffff'};
          color: inherit;
          font-family: inherit;
          font-size: 13px;
        }

        .filter-input:focus {
          outline: none;
          border-color: #2196f3;
        }

        .stats {
          font-size: 13px;
          color: ${isDarkMode ? '#9e9e9e' : '#666666'};
        }

        .precision-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .precision-selector select {
          padding: 4px 8px;
          border: 1px solid ${isDarkMode ? '#404040' : '#d0d0d0'};
          border-radius: 4px;
          background: ${isDarkMode ? '#3c3c3c' : '#ffffff'};
          color: inherit;
          cursor: pointer;
        }

        .packets-table-container {
          flex: 1;
          overflow: auto;
          position: relative;
        }

        .packets-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .packets-table th {
          text-align: left;
          padding: 12px;
          background: ${isDarkMode ? '#2d2d2d' : '#f5f5f5'};
          border-bottom: 2px solid ${isDarkMode ? '#404040' : '#e0e0e0'};
          position: sticky;
          top: 0;
          font-weight: 600;
          z-index: 10;
        }

        .packets-table td {
          padding: 10px 12px;
          border-bottom: 1px solid ${isDarkMode ? '#333333' : '#f0f0f0'};
          cursor: pointer;
        }

        .packet-row:hover {
          background: ${isDarkMode ? '#2a2a2a' : '#f9f9f9'};
        }

        .packet-row.selected {
          background: ${isDarkMode ? '#264f78' : '#e3f2fd'};
        }

        .timestamp-cell {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          cursor: help;
          border-bottom: 1px dotted;
        }

        .protocol-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 1px 0 rgba(0,0,0,0.1);
        }

        .info-cell {
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: ${isDarkMode ? '#9e9e9e' : '#666666'};
          padding: 4px 8px;
          border-radius: 3px;
        }

        .expand-btn:hover {
          background: ${isDarkMode ? '#404040' : '#e0e0e0'};
        }

        .expanded-row td {
          padding: 16px;
          background: ${isDarkMode ? '#252526' : '#fafafa'};
        }

        .packet-details {
          padding: 12px;
        }

        .detail-section {
          margin-bottom: 16px;
        }

        .detail-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .hex-dump {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          background: ${isDarkMode ? '#1e1e1e' : '#f5f5f5'};
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
        }

        .hex-line {
          font-family: monospace;
          margin-bottom: 2px;
          white-space: nowrap;
        }

        .hex-offset {
          display: inline-block;
          width: 80px;
          color: ${isDarkMode ? '#9e9e9e' : '#666666'};
          user-select: none;
        }

        .hex-bytes {
          display: inline-block;
          width: 480px;
          font-family: monospace;
          margin: 0 12px;
        }

        .hex-ascii {
          display: inline-block;
          font-family: monospace;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-top: 1px solid ${isDarkMode ? '#404040' : '#e0e0e0'};
          background: ${isDarkMode ? '#252526' : '#ffffff'};
        }

        .pagination button {
          padding: 6px 12px;
          border: 1px solid ${isDarkMode ? '#404040' : '#d0d0d0'};
          background: ${isDarkMode ? '#3c3c3c' : '#ffffff'};
          color: inherit;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }

        .pagination button:hover:not(:disabled) {
          background: ${isDarkMode ? '#4c4c4c' : '#f0f0f0'};
        }

        .pagination button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .details-panel {
          position: fixed;
          right: 0;
          top: 0;
          width: 450px;
          height: 100%;
          background: ${isDarkMode ? '#2d2d2d' : '#ffffff'};
          border-left: 1px solid ${isDarkMode ? '#404040' : '#e0e0e0'};
          box-shadow: -2px 0 8px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          z-index: 1000;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid ${isDarkMode ? '#404040' : '#e0e0e0'};
          background: ${isDarkMode ? '#252526' : '#f8f9fa'};
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .details-header h4 {
          margin: 0;
          font-size: 16px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: ${isDarkMode ? '#9e9e9e' : '#666666'};
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: ${isDarkMode ? '#404040' : '#e0e0e0'};
        }

        .details-content {
          padding: 20px;
        }

        .detail-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-row {
          display: flex;
          gap: 12px;
          line-height: 1.5;
        }

        .detail-label {
          font-weight: 600;
          min-width: 110px;
          color: ${isDarkMode ? '#9e9e9e' : '#666666'};
        }

        .detail-value {
          flex: 1;
          word-break: break-word;
        }

        .detail-sub {
          font-size: 11px;
          color: ${isDarkMode ? '#9e9e9e' : '#999999'};
          font-family: monospace;
        }

        .info-text {
          font-family: monospace;
          font-size: 12px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          gap: 16px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid ${isDarkMode ? '#404040' : '#e0e0e0'};
          border-top-color: #2196f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: ${isDarkMode ? '#9e9e9e' : '#999999'};
          font-size: 14px;
          gap: 8px;
          text-align: center;
        }

        .hint {
          font-size: 12px;
          opacity: 0.7;
        }

        .warning-text {
          font-size: 12px;
          color: ${isDarkMode ? '#ef9a9a' : '#c62828'};
          margin: 4px 0;
        }

        /* Scrollbar styling */
        .packets-table-container::-webkit-scrollbar,
        .details-panel::-webkit-scrollbar,
        .debug-panel::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .packets-table-container::-webkit-scrollbar-track,
        .details-panel::-webkit-scrollbar-track,
        .debug-panel::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#252526' : '#f0f0f0'};
        }

        .packets-table-container::-webkit-scrollbar-thumb,
        .details-panel::-webkit-scrollbar-thumb,
        .debug-panel::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#404040' : '#c0c0c0'};
          border-radius: 5px;
        }

        .packets-table-container::-webkit-scrollbar-thumb:hover,
        .details-panel::-webkit-scrollbar-thumb:hover,
        .debug-panel::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#555555' : '#a0a0a0'};
        }
      `}</style>
    </div>
  )
}
