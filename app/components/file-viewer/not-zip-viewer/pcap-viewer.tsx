// React
import * as React from 'react'

// Типы для PCAP
interface PcapGlobalHeader {
  magicNumber: number
  versionMajor: number
  versionMinor: number
  thiszone: number
  sigfigs: number
  snaplen: number
  network: number
  isNanosecond: boolean
  isSwapped: boolean
}

// Типы для сетевых адресов
interface EthernetHeader {
  destMac: string
  srcMac: string
  type: number
}

interface IPv4Header {
  version: number
  ihl: number
  tos: number
  totalLength: number
  identification: number
  flags: number
  fragmentOffset: number
  ttl: number
  protocol: number
  checksum: number
  srcAddr: string
  destAddr: string
}

interface IPv6Header {
  version: number
  trafficClass: number
  flowLabel: number
  payloadLength: number
  nextHeader: number
  hopLimit: number
  srcAddr: string
  destAddr: string
}

interface TCPHeader {
  srcPort: number
  destPort: number
  sequenceNumber: number
  acknowledgmentNumber: number
  dataOffset: number
  flags: number
  window: number
  checksum: number
  urgentPointer: number
}

interface UDPHeader {
  srcPort: number
  destPort: number
  length: number
  checksum: number
}

interface ARPHeader {
  hardwareType: number
  protocolType: number
  hardwareSize: number
  protocolSize: number
  opcode: number
  senderMac: string
  senderIp: string
  targetMac: string
  targetIp: string
}

interface PacketInfo {
  timestamp: string
  source: string
  destination: string
  protocol: string
  protocolNumber: number
  info: string
  length: number
}

interface PcapPacket {
  index: number
  timestampSeconds: number
  timestampFraction: number
  timestamp: number
  capturedLength: number
  originalLength: number
  data: Uint8Array
  parsed?: PacketInfo
}

interface PcapFile {
  header: PcapGlobalHeader
  packets: PcapPacket[]
}

// Константы для magic numbers
const MAGIC_NUMBERS = {
  MICRO_LE: 0xa1b2c3d4,
  MICRO_BE: 0xd4c3b2a1,
  NANO_LE: 0xa1b23c4d,
  NANO_BE: 0x4d3cb2a1
}

// Протоколы Ethernet
const ETHER_TYPES: Record<number, string> = {
  0x0800: 'IPv4',
  0x0806: 'ARP',
  0x86dd: 'IPv6',
  0x8100: 'VLAN',
  0x88cc: 'LLDP',
  0x8809: 'Ethernet OAM'
}

// IP протоколы
const IP_PROTOCOLS: Record<number, string> = {
  1: 'ICMP',
  2: 'IGMP',
  6: 'TCP',
  17: 'UDP',
  41: 'IPv6 encapsulation',
  50: 'ESP',
  51: 'AH',
  58: 'ICMPv6',
  89: 'OSPF',
  132: 'SCTP'
}

// TCP флаги
const TCP_FLAGS = {
  FIN: 0x01,
  SYN: 0x02,
  RST: 0x04,
  PSH: 0x08,
  ACK: 0x10,
  URG: 0x20,
  ECE: 0x40,
  CWR: 0x80
}

// ARP операции
const ARP_OPERATIONS: Record<number, string> = {
  1: 'Request',
  2: 'Reply',
  3: 'RARP Request',
  4: 'RARP Reply'
}

class PcapParser {
  static detectFormat(magicNumber: number): 'microsecond' | 'nanosecond' {
    if (
      magicNumber === MAGIC_NUMBERS.NANO_LE ||
      magicNumber === MAGIC_NUMBERS.NANO_BE
    ) {
      return 'nanosecond'
    }
    return 'microsecond'
  }

  static isSwapped(magicNumber: number): boolean {
    return (
      magicNumber === MAGIC_NUMBERS.MICRO_BE ||
      magicNumber === MAGIC_NUMBERS.NANO_BE
    )
  }

  private static readUint32(
    view: DataView,
    offset: number,
    isSwapped: boolean
  ): number {
    return isSwapped
      ? view.getUint32(offset, false)
      : view.getUint32(offset, true)
  }

  private static readUint16(
    view: DataView,
    offset: number,
    isSwapped: boolean
  ): number {
    return isSwapped
      ? view.getUint16(offset, false)
      : view.getUint16(offset, true)
  }

  static parseHeader(buffer: ArrayBuffer): PcapGlobalHeader {
    const view = new DataView(buffer)
    const magicNumber = view.getUint32(0, true)
    const swapped = this.isSwapped(magicNumber)
    const isNanosecond = this.detectFormat(magicNumber) === 'nanosecond'

    return {
      magicNumber,
      versionMajor: this.readUint16(view, 4, swapped),
      versionMinor: this.readUint16(view, 6, swapped),
      thiszone: this.readUint32(view, 8, swapped),
      sigfigs: this.readUint32(view, 12, swapped),
      snaplen: this.readUint32(view, 16, swapped),
      network: this.readUint32(view, 20, swapped),
      isNanosecond,
      isSwapped: swapped
    }
  }

  static parsePackets(
    buffer: ArrayBuffer,
    header: PcapGlobalHeader
  ): PcapPacket[] {
    const view = new DataView(buffer)
    const packets: PcapPacket[] = []
    let offset = 24
    let index = 0

    while (offset + 16 <= buffer.byteLength) {
      try {
        const tsSec = this.readUint32(view, offset, header.isSwapped)
        const tsFrac = this.readUint32(view, offset + 4, header.isSwapped)
        const capturedLength = this.readUint32(
          view,
          offset + 8,
          header.isSwapped
        )
        const originalLength = this.readUint32(
          view,
          offset + 12,
          header.isSwapped
        )

        offset += 16

        if (offset + capturedLength > buffer.byteLength) break

        const packetData = new Uint8Array(
          buffer.slice(offset, offset + capturedLength)
        )
        offset += capturedLength

        let timestamp: number
        if (header.isNanosecond) {
          timestamp = tsSec + tsFrac / 1_000_000_000
        } else {
          timestamp = tsSec + tsFrac / 1_000_000
        }

        const packet: PcapPacket = {
          index: index++,
          timestampSeconds: tsSec,
          timestampFraction: tsFrac,
          timestamp,
          capturedLength,
          originalLength,
          data: packetData
        }

        packet.parsed = PacketParser.parsePacket(packetData, timestamp)

        packets.push(packet)
      } catch (err) {
        console.error('Error parsing packet', index, err)
        break
      }
    }

    return packets
  }

  static parse(arrayBuffer: ArrayBuffer): PcapFile {
    const header = this.parseHeader(arrayBuffer)
    const packets = this.parsePackets(arrayBuffer, header)
    return { header, packets }
  }
}

// Класс для парсинга содержимого пакетов
class PacketParser {
  private static formatMac(mac: Uint8Array): string {
    return Array.from(mac.slice(0, 6))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase()
  }

  private static formatIpv4(ip: Uint8Array): string {
    return Array.from(ip.slice(0, 4)).join('.')
  }

  private static formatIpv6(ip: Uint8Array): string {
    const parts: string[] = []
    for (let i = 0; i < 16; i += 2) {
      parts.push(((ip[i] << 8) | ip[i + 1]).toString(16))
    }
    return parts
      .join(':')
      .replace(/\b:?0+\b/g, '')
      .replace(/::+/g, '::')
  }

  private static parseEthernetHeader(data: Uint8Array): EthernetHeader | null {
    if (data.length < 14) return null

    return {
      destMac: this.formatMac(data.subarray(0, 6)),
      srcMac: this.formatMac(data.subarray(6, 12)),
      type: (data[12] << 8) | data[13]
    }
  }

  private static parseIPv4Header(
    data: Uint8Array,
    offset: number = 0
  ): IPv4Header | null {
    if (data.length < offset + 20) return null

    const versionIhl = data[offset]
    const version = (versionIhl >> 4) & 0x0f
    const ihl = versionIhl & 0x0f

    if (version !== 4 || data.length < offset + ihl * 4) return null

    return {
      version,
      ihl,
      tos: data[offset + 1],
      totalLength: (data[offset + 2] << 8) | data[offset + 3],
      identification: (data[offset + 4] << 8) | data[offset + 5],
      flags: (data[offset + 6] >> 5) & 0x07,
      fragmentOffset: ((data[offset + 6] & 0x1f) << 8) | data[offset + 7],
      ttl: data[offset + 8],
      protocol: data[offset + 9],
      checksum: (data[offset + 10] << 8) | data[offset + 11],
      srcAddr: this.formatIpv4(data.subarray(offset + 12, offset + 16)),
      destAddr: this.formatIpv4(data.subarray(offset + 16, offset + 20))
    }
  }

  private static parseIPv6Header(
    data: Uint8Array,
    offset: number = 0
  ): IPv6Header | null {
    if (data.length < offset + 40) return null

    const versionClassFlow =
      (data[offset] << 4) | ((data[offset + 1] >> 4) & 0x0f)

    return {
      version: (versionClassFlow >> 4) & 0x0f,
      trafficClass:
        ((data[offset] & 0x0f) << 4) | ((data[offset + 1] >> 4) & 0x0f),
      flowLabel:
        ((data[offset + 1] & 0x0f) << 16) |
        (data[offset + 2] << 8) |
        data[offset + 3],
      payloadLength: (data[offset + 4] << 8) | data[offset + 5],
      nextHeader: data[offset + 6],
      hopLimit: data[offset + 7],
      srcAddr: this.formatIpv6(data.subarray(offset + 8, offset + 24)),
      destAddr: this.formatIpv6(data.subarray(offset + 24, offset + 40))
    }
  }

  private static parseTCPHeader(
    data: Uint8Array,
    offset: number = 0
  ): TCPHeader | null {
    if (data.length < offset + 20) return null

    const dataOffset = (data[offset + 12] >> 4) & 0x0f

    return {
      srcPort: (data[offset] << 8) | data[offset + 1],
      destPort: (data[offset + 2] << 8) | data[offset + 3],
      sequenceNumber:
        (data[offset + 4] << 24) |
        (data[offset + 5] << 16) |
        (data[offset + 6] << 8) |
        data[offset + 7],
      acknowledgmentNumber:
        (data[offset + 8] << 24) |
        (data[offset + 9] << 16) |
        (data[offset + 10] << 8) |
        data[offset + 11],
      dataOffset,
      flags: data[offset + 13],
      window: (data[offset + 14] << 8) | data[offset + 15],
      checksum: (data[offset + 16] << 8) | data[offset + 17],
      urgentPointer: (data[offset + 18] << 8) | data[offset + 19]
    }
  }

  private static parseUDPHeader(
    data: Uint8Array,
    offset: number = 0
  ): UDPHeader | null {
    if (data.length < offset + 8) return null

    return {
      srcPort: (data[offset] << 8) | data[offset + 1],
      destPort: (data[offset + 2] << 8) | data[offset + 3],
      length: (data[offset + 4] << 8) | data[offset + 5],
      checksum: (data[offset + 6] << 8) | data[offset + 7]
    }
  }

  private static parseARPHeader(
    data: Uint8Array,
    offset: number = 0
  ): ARPHeader | null {
    if (data.length < offset + 28) return null

    return {
      hardwareType: (data[offset] << 8) | data[offset + 1],
      protocolType: (data[offset + 2] << 8) | data[offset + 3],
      hardwareSize: data[offset + 4],
      protocolSize: data[offset + 5],
      opcode: (data[offset + 6] << 8) | data[offset + 7],
      senderMac: this.formatMac(data.subarray(offset + 8, offset + 14)),
      senderIp: this.formatIpv4(data.subarray(offset + 14, offset + 18)),
      targetMac: this.formatMac(data.subarray(offset + 18, offset + 24)),
      targetIp: this.formatIpv4(data.subarray(offset + 24, offset + 28))
    }
  }

  private static getTCPFlagsString(flags: number): string {
    const flagStrings: string[] = []
    if (flags & TCP_FLAGS.FIN) flagStrings.push('FIN')
    if (flags & TCP_FLAGS.SYN) flagStrings.push('SYN')
    if (flags & TCP_FLAGS.RST) flagStrings.push('RST')
    if (flags & TCP_FLAGS.PSH) flagStrings.push('PSH')
    if (flags & TCP_FLAGS.ACK) flagStrings.push('ACK')
    if (flags & TCP_FLAGS.URG) flagStrings.push('URG')
    return flagStrings.join(',')
  }

  static parsePacket(data: Uint8Array, timestamp: number): PacketInfo {
    const date = new Date(timestamp * 1000)
    const timestampStr = date.toISOString().replace('T', ' ').slice(0, 23)

    const eth = this.parseEthernetHeader(data)
    if (!eth) {
      return {
        timestamp: timestampStr,
        source: 'Unknown',
        destination: 'Unknown',
        protocol: 'Unknown',
        protocolNumber: 0,
        info: 'Invalid packet',
        length: data.length
      }
    }

    const etherType = eth.type
    const protocolName = ETHER_TYPES[etherType] || `0x${etherType.toString(16)}`

    let source = eth.srcMac
    let destination = eth.destMac
    let protocol = protocolName
    let protocolNumber = etherType
    let info = ''

    if (etherType === 0x0800) {
      const ipv4 = this.parseIPv4Header(data, 14)
      if (ipv4) {
        source = ipv4.srcAddr
        destination = ipv4.destAddr
        protocol = IP_PROTOCOLS[ipv4.protocol] || `Protocol ${ipv4.protocol}`
        protocolNumber = ipv4.protocol

        const ipOffset = 14 + ipv4.ihl * 4

        if (ipv4.protocol === 6) {
          const tcp = this.parseTCPHeader(data, ipOffset)
          if (tcp) {
            info = `${tcp.srcPort} → ${tcp.destPort} [${this.getTCPFlagsString(tcp.flags)}] Seq=${tcp.sequenceNumber}`
            source = `${source}:${tcp.srcPort}`
            destination = `${destination}:${tcp.destPort}`
          }
        } else if (ipv4.protocol === 17) {
          const udp = this.parseUDPHeader(data, ipOffset)
          if (udp) {
            info = `${udp.srcPort} → ${udp.destPort} Len=${udp.length}`
            source = `${source}:${udp.srcPort}`
            destination = `${destination}:${udp.destPort}`
          }
        } else if (ipv4.protocol === 1) {
          const type = data[ipOffset]
          const code = data[ipOffset + 1]
          const icmpTypes: Record<number, string> = {
            0: 'Echo Reply',
            3: 'Destination Unreachable',
            5: 'Redirect',
            8: 'Echo Request',
            11: 'Time Exceeded'
          }
          info = icmpTypes[type] || `Type ${type}, Code ${code}`
        } else {
          info = `IP packet, TTL=${ipv4.ttl}`
        }
      }
    } else if (etherType === 0x86dd) {
      const ipv6 = this.parseIPv6Header(data, 14)
      if (ipv6) {
        source = ipv6.srcAddr
        destination = ipv6.destAddr
        protocol =
          IP_PROTOCOLS[ipv6.nextHeader] || `Protocol ${ipv6.nextHeader}`
        protocolNumber = ipv6.nextHeader
        info = `IPv6, Hop Limit=${ipv6.hopLimit}`
      }
    } else if (etherType === 0x0806) {
      const arp = this.parseARPHeader(data, 14)
      if (arp) {
        const operation = ARP_OPERATIONS[arp.opcode] || `Op ${arp.opcode}`
        source = arp.senderIp
        destination = arp.targetIp
        protocol = 'ARP'
        protocolNumber = 0x0806
        info = `${operation}: Who has ${arp.targetIp}? Tell ${arp.senderIp}`
        if (arp.opcode === 2) {
          info = `${operation}: ${arp.senderIp} is at ${arp.senderMac}`
        }
      }
    } else {
      info = `Ethernet frame, Type: ${protocolName}`
    }

    return {
      timestamp: timestampStr,
      source,
      destination,
      protocol,
      protocolNumber,
      info,
      length: data.length
    }
  }
}

// Компонент HexDump с поддержкой темной темы (исправленные цвета для светлого режима)
const HexDump: React.FC<{
  data: Uint8Array
  maxBytes?: number
  isDarkMode?: boolean
}> = ({ data, maxBytes = 512, isDarkMode = false }) => {
  const [copyStatus, setCopyStatus] = React.useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [hoveredByte, setHoveredByte] = React.useState<number | null>(null)

  const displayData = React.useMemo(() => {
    const bytes = data.slice(0, maxBytes)
    const isTruncated = data.length > maxBytes

    // Анализ структуры пакета для умной подсветки
    const getByteColor = (
      offset: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      value: number
    ): { color: string; type: string } => {
      if (offset < 14) {
        if (offset < 6) return { color: '#0088cc', type: 'MAC Destination' }
        if (offset < 12) return { color: '#0088cc', type: 'MAC Source' }
        if (offset < 14) return { color: '#0055aa', type: 'EtherType' }
      }

      if (
        offset >= 14 &&
        offset < 34 &&
        data[12] === 0x08 &&
        data[13] === 0x00
      ) {
        const ipOffset = offset - 14
        if (ipOffset === 0) return { color: '#22863a', type: 'Version/IHL' }
        if (ipOffset === 1) return { color: '#22863a', type: 'DSCP/ECN' }
        if (ipOffset >= 2 && ipOffset <= 3)
          return { color: '#b8860b', type: 'Total Length' }
        if (ipOffset >= 12 && ipOffset <= 15)
          return { color: '#9333ea', type: 'Source IP' }
        if (ipOffset >= 16 && ipOffset <= 19)
          return { color: '#9333ea', type: 'Destination IP' }
        if (ipOffset === 9) return { color: '#dc2626', type: 'Protocol' }
        return { color: '#22863a', type: 'IPv4 Header' }
      }

      if (offset >= 34 && data[23] === 6) {
        const tcpOffset = offset - 34
        if (tcpOffset >= 0 && tcpOffset <= 1)
          return { color: '#dc2626', type: 'Source Port' }
        if (tcpOffset >= 2 && tcpOffset <= 3)
          return { color: '#dc2626', type: 'Destination Port' }
        if (tcpOffset === 13) return { color: '#b8860b', type: 'TCP Flags' }
        return { color: '#b8860b', type: 'TCP Header' }
      }

      if (offset >= 34 && data[23] === 17) {
        const udpOffset = offset - 34
        if (udpOffset >= 0 && udpOffset <= 1)
          return { color: '#dc2626', type: 'Source Port' }
        if (udpOffset >= 2 && udpOffset <= 3)
          return { color: '#dc2626', type: 'Destination Port' }
        return { color: '#0088cc', type: 'UDP Header' }
      }

      return { color: '#6c757d', type: 'Payload' }
    }

    const lines: {
      offset: string
      bytes: { value: string; offset: number; color: string; type: string }[]
    }[] = []

    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16)
      const byteItems: {
        value: string
        offset: number
        color: string
        type: string
      }[] = []

      for (let j = 0; j < chunk.length; j++) {
        const globalOffset = i + j
        const { color, type } = getByteColor(globalOffset, chunk[j])
        byteItems.push({
          value: chunk[j].toString(16).padStart(2, '0'),
          offset: globalOffset,
          color: color,
          type: type
        })
      }

      const offset = i.toString(16).padStart(6, '0')
      lines.push({ offset, bytes: byteItems })
    }

    return { lines, isTruncated, totalBytes: data.length }
  }, [data, maxBytes])

  const copyAllHex = async () => {
    try {
      const allBytes = data.slice(0, maxBytes)
      const hexString = Array.from(allBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
      await navigator.clipboard.writeText(hexString)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  const copyAsCArray = async () => {
    try {
      const allBytes = data.slice(0, maxBytes)
      const bytesPerLine = 16
      const lines: string[] = []
      for (let i = 0; i < allBytes.length; i += bytesPerLine) {
        const chunk = allBytes.slice(i, i + bytesPerLine)
        const hexValues = Array.from(chunk)
          .map((b) => `0x${b.toString(16).padStart(2, '0')}`)
          .join(', ')
        lines.push(
          `  ${hexValues}${i + bytesPerLine < allBytes.length ? ',' : ''}`
        )
      }
      const arrayString = `unsigned char data[] = {\n${lines.join('\n')}\n};\n// Size: ${allBytes.length} bytes`
      await navigator.clipboard.writeText(arrayString)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  const copyByte = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 1000)
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 1000)
    }
  }

  const isHovered = (byteOffset: number): boolean => {
    return hoveredByte !== null && hoveredByte === byteOffset
  }

  const hexStyles = {
    container: {
      fontFamily: 'Monaco, Menlo, monospace',
      fontSize: 11,
      background: isDarkMode ? '#1e1e1e' : '#ffffff',
      color: isDarkMode ? '#d4d4d4' : '#212529',
      padding: '6px 8px',
      borderRadius: 4,
      overflow: 'hidden' as const,
      border: isDarkMode ? '1px solid #333' : '1px solid #d0d7de'
    },
    toolbar: {
      display: 'flex' as const,
      gap: 8,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: isDarkMode ? '1px solid #333' : '1px solid #d0d7de',
      alignItems: 'center',
      flexWrap: 'wrap' as const
    },
    button: {
      background: isDarkMode ? '#2d2d2d' : '#f0f0f0',
      border: isDarkMode ? '1px solid #3e3e3e' : '1px solid #d0d7de',
      color: isDarkMode ? '#d4d4d4' : '#24292f',
      padding: '3px 8px',
      borderRadius: 3,
      fontSize: 10,
      cursor: 'pointer',
      fontFamily: 'inherit'
    },
    success: {
      color: isDarkMode ? '#98c379' : '#22863a',
      fontSize: 10
    },
    error: {
      color: isDarkMode ? '#e06c75' : '#dc2626',
      fontSize: 10
    },
    legend: {
      display: 'flex' as const,
      gap: 12,
      marginBottom: 8,
      padding: '4px 8px',
      background: isDarkMode ? '#252526' : '#f6f8fa',
      borderRadius: 4,
      fontSize: 10,
      flexWrap: 'wrap' as const,
      border: isDarkMode ? 'none' : '1px solid #e1e4e8'
    },
    hexContent: {
      maxHeight: 180,
      overflowY: 'auto' as const,
      overflowX: 'auto' as const
    },
    line: {
      fontFamily: 'monospace',
      lineHeight: 1.5,
      whiteSpace: 'pre' as const,
      fontSize: 11,
      marginBottom: 1
    },
    offset: {
      color: isDarkMode ? '#858585' : '#57606a',
      display: 'inline-block',
      width: 60,
      userSelect: 'none' as const,
      fontSize: 10
    },
    bytes: {
      display: 'inline-flex',
      flexWrap: 'nowrap' as const,
      gap: 1
    },
    byte: {
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 26,
      padding: '1px 2px',
      fontWeight: 500,
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      fontSize: 10
    },
    truncated: {
      color: isDarkMode ? '#858585' : '#57606a',
      marginTop: 6,
      paddingTop: 4,
      borderTop: isDarkMode ? '1px solid #333' : '1px solid #d0d7de',
      fontStyle: 'italic',
      fontSize: 9
    }
  }

  return (
    <div style={hexStyles.container}>
      <div style={hexStyles.toolbar}>
        <button
          onClick={() => {
            void copyAllHex()
          }}
          style={hexStyles.button}
        >
          📋 Копировать все HEX
        </button>
        <button
          onClick={() => {
            void copyAsCArray()
          }}
          style={hexStyles.button}
        >
          📝 Копировать как C-массив
        </button>
        {copyStatus === 'success' && (
          <span style={hexStyles.success}>✓ Скопировано!</span>
        )}
        {copyStatus === 'error' && (
          <span style={hexStyles.error}>✗ Ошибка</span>
        )}
      </div>

      <div style={hexStyles.legend}>
        <span style={{ color: '#0088cc' }}>● MAC/EtherType</span>
        <span style={{ color: '#22863a' }}>● IPv4</span>
        <span style={{ color: '#9333ea' }}>● IP адреса</span>
        <span style={{ color: '#dc2626' }}>● Порты/Протоколы</span>
        <span style={{ color: '#b8860b' }}>● Флаги/Length</span>
        <span style={{ color: '#6c757d' }}>● Payload</span>
      </div>

      <div style={hexStyles.hexContent}>
        {displayData.lines.map((line, i) => (
          <div key={i} style={hexStyles.line}>
            <span style={hexStyles.offset}>{line.offset}</span>
            <span style={hexStyles.bytes}>
              {line.bytes.map((byte, j) => (
                <span
                  key={j}
                  style={{
                    ...hexStyles.byte,
                    color: byte.color,
                    backgroundColor: isHovered(byte.offset)
                      ? isDarkMode
                        ? '#3a3a3a'
                        : '#d0d7de'
                      : 'transparent',
                    fontWeight: isHovered(byte.offset) ? 'bold' : 'normal'
                  }}
                  onMouseEnter={() => setHoveredByte(byte.offset)}
                  onMouseLeave={() => setHoveredByte(null)}
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={() => copyByte(byte.value)}
                  title={`${byte.type} | 0x${byte.value} = ${parseInt(byte.value, 16)} | Кликните, чтобы скопировать`}
                >
                  {byte.value}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {displayData.isTruncated && (
        <div style={hexStyles.truncated}>
          ... +{displayData.totalBytes - maxBytes} байт (показано {maxBytes})
        </div>
      )}
    </div>
  )
}

// Пропсы компонента
interface PcapFileViewerProps {
  pcapBlob?: Blob | null
  fileName?: string
  isDarkMode?: boolean
  onLoad?: (packetCount: number) => void
  onError?: (error: Error) => void
}

// Основной компонент
export const PcapFileViewer: React.FC<PcapFileViewerProps> = ({
  pcapBlob = null,
  fileName: externalFileName = '',
  isDarkMode = false,
  onLoad,
  onError
}) => {
  const [pcapData, setPcapData] = React.useState<PcapFile | null>(null)
  const [fileName, setFileName] = React.useState<string>(externalFileName)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState('')
  const [protocolFilter, setProtocolFilter] = React.useState<string>('')
  const [selectedPacket, setSelectedPacket] = React.useState<PcapPacket | null>(
    null
  )
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({ key: 'index', direction: 'asc' })
  const [showFilterHelp, setShowFilterHelp] = React.useState(false)

  const [isMainSectionOpen, setIsMainSectionOpen] = React.useState(true)
  const [isPacketDetailsOpen, setIsPacketDetailsOpen] = React.useState(true)

  const mainContentRef = React.useRef<HTMLDivElement>(null)
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const itemsPerPage = 5

  const loadPcapFromBlob = React.useCallback(
    async (blob: Blob, name: string) => {
      setLoading(true)
      setError(null)
      setPcapData(null)
      setSelectedPacket(null)
      setCurrentPage(1)

      try {
        const arrayBuffer = await blob.arrayBuffer()
        const parsed = PcapParser.parse(arrayBuffer)
        setPcapData(parsed)
        setFileName(name)
        onLoad?.(parsed.packets.length)
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Ошибка парсинга PCAP'
        setError(errorMsg)
        onError?.(err instanceof Error ? err : new Error(errorMsg))
      } finally {
        setLoading(false)
      }
    },
    [onLoad, onError]
  )

  React.useEffect(() => {
    if (pcapBlob) {
      const name = externalFileName || `pcap_${Date.now()}.pcap`
      void loadPcapFromBlob(pcapBlob, name)
    } else {
      setPcapData(null)
      setSelectedPacket(null)
      setError(null)
      setFilter('')
      setProtocolFilter('')
      setCurrentPage(1)
    }
  }, [pcapBlob, externalFileName, loadPcapFromBlob])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Б'
    const k = 1024
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getProtocolIcon = (protocol: string): string => {
    const icons: Record<string, string> = {
      TCP: '🔵',
      UDP: '🟢',
      ICMP: '🟡',
      ARP: '🟠',
      IPv4: '🔷',
      IPv6: '🔶'
    }
    return icons[protocol] || '📦'
  }

  const availableProtocols = React.useMemo(() => {
    if (!pcapData) return []
    const protocols = new Set<string>()
    pcapData.packets.forEach((packet) => {
      if (packet.parsed) protocols.add(packet.parsed.protocol)
    })
    return Array.from(protocols).sort()
  }, [pcapData])

  const filteredPackets = React.useMemo(() => {
    if (!pcapData) return []
    return pcapData.packets
      .filter((packet) => {
        if (!packet.parsed) return false
        const f = filter.toLowerCase()
        return (
          filter === '' ||
          packet.parsed.source.toLowerCase().includes(f) ||
          packet.parsed.destination.toLowerCase().includes(f) ||
          packet.parsed.protocol.toLowerCase().includes(f) ||
          packet.parsed.info.toLowerCase().includes(f)
        )
      })
      .filter(
        (p) => protocolFilter === '' || p.parsed?.protocol === protocolFilter
      )
  }, [pcapData, filter, protocolFilter])

  const sortedPackets = React.useMemo(() => {
    const sorted = [...filteredPackets]
    sorted.sort((a, b) => {
      if (!a.parsed || !b.parsed) return 0
      const dir = sortConfig.direction === 'asc' ? 1 : -1
      switch (sortConfig.key) {
        case 'index':
          return (a.index - b.index) * dir
        case 'timestamp':
          return (a.timestamp - b.timestamp) * dir
        case 'source':
          return a.parsed.source.localeCompare(b.parsed.source) * dir
        case 'destination':
          return a.parsed.destination.localeCompare(b.parsed.destination) * dir
        case 'protocol':
          return a.parsed.protocol.localeCompare(b.parsed.protocol) * dir
        case 'length':
          return (a.capturedLength - b.capturedLength) * dir
        default:
          return 0
      }
    })
    return sorted
  }, [filteredPackets, sortConfig])

  const totalPages = Math.ceil(sortedPackets.length / itemsPerPage)
  const paginatedPackets = sortedPackets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getNetworkType = (network: number): string => {
    const types: Record<number, string> = {
      1: 'Ethernet',
      105: 'Wi-Fi',
      113: 'Linux',
      228: 'Bluetooth'
    }
    return types[network] || `Тип ${network}`
  }

  React.useEffect(() => {
    if (selectedPacket && tableContainerRef.current) {
      const row = document.querySelector(`.packet-row-${selectedPacket.index}`)
      row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedPacket])

  // Динамические стили в зависимости от темы
  const getStyles = React.useCallback(
    () => ({
      container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", monospace',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
        overflow: 'hidden' as const
      },
      infoBar: {
        display: 'flex',
        gap: 16,
        padding: '6px 12px',
        backgroundColor: isDarkMode ? '#2d2d2d' : '#e9ecef',
        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #dee2e6',
        fontSize: 12,
        flexShrink: 0,
        color: isDarkMode ? '#d4d4d4' : '#495057'
      },
      infoBarItem: {
        color: isDarkMode ? '#abb2bf' : '#495057'
      },
      loading: {
        textAlign: 'center' as const,
        padding: 40,
        fontSize: 13,
        color: isDarkMode ? '#abb2bf' : '#6c757d'
      },
      error: {
        backgroundColor: isDarkMode ? '#2c1e1e' : '#f8d7da',
        color: isDarkMode ? '#e06c75' : '#721c24',
        padding: 10,
        margin: 12,
        borderRadius: 4,
        fontSize: 12,
        flexShrink: 0,
        border: isDarkMode ? '1px solid #e06c75' : 'none'
      },
      emptyState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        color: isDarkMode ? '#abb2bf' : '#6c757d',
        gap: 8
      },
      emptyStateIcon: {
        fontSize: 48
      },
      emptyStateText: {
        fontSize: 13
      },
      scrollableContent: {
        flex: 1,
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
        padding: '6px 8px 8px 8px'
      },
      section: {
        marginBottom: 8,
        border: isDarkMode ? '1px solid #333' : '1px solid #dee2e6',
        borderRadius: 6,
        backgroundColor: isDarkMode ? '#252526' : 'white',
        overflow: 'hidden' as const
      },
      sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #dee2e6',
        fontWeight: 600,
        fontSize: 13,
        color: isDarkMode ? '#d4d4d4' : '#212529'
      },
      sectionTitle: { fontSize: 13 },
      sectionBadge: {
        fontSize: 11,
        fontWeight: 'normal',
        backgroundColor: isDarkMode ? '#3a3a3a' : '#e9ecef',
        padding: '2px 8px',
        borderRadius: 10,
        color: isDarkMode ? '#abb2bf' : '#495057'
      },
      sectionContent: { padding: 10 },
      compactInfo: {
        display: 'flex',
        gap: 16,
        padding: '6px 10px',
        backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
        borderRadius: 4,
        marginBottom: 10,
        fontSize: 11,
        flexWrap: 'wrap' as const,
        color: isDarkMode ? '#abb2bf' : '#495057'
      },
      compactControls: {
        display: 'flex',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center'
      },
      filterInput: {
        flex: 1,
        padding: '5px 10px',
        border: isDarkMode ? '1px solid #3e3e3e' : '1px solid #ddd',
        borderRadius: 4,
        fontSize: 12,
        backgroundColor: isDarkMode ? '#2d2d2d' : 'white',
        color: isDarkMode ? '#d4d4d4' : '#212529'
      },
      protocolSelect: {
        padding: '5px 10px',
        border: isDarkMode ? '1px solid #3e3e3e' : '1px solid #ddd',
        borderRadius: 4,
        fontSize: 12,
        backgroundColor: isDarkMode ? '#2d2d2d' : 'white',
        color: isDarkMode ? '#d4d4d4' : '#212529'
      },
      packetCount: {
        backgroundColor: isDarkMode ? '#2d2d2d' : '#e9ecef',
        padding: '5px 10px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        color: isDarkMode ? '#98c379' : '#495057'
      },
      tableWrapper: {
        overflowX: 'auto' as const,
        overflowY: 'auto' as const,
        maxHeight: 350,
        border: isDarkMode ? '1px solid #333' : '1px solid #eee',
        borderRadius: 4
      },
      table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: 12,
        tableLayout: 'fixed' as const,
        color: isDarkMode ? '#d4d4d4' : '#212529'
      },
      tableHeader: {
        backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa'
      },
      th: {
        position: 'sticky' as const,
        top: 0,
        background: isDarkMode ? '#2d2d2d' : '#f8f9fa',
        zIndex: 10,
        padding: '6px 8px',
        fontSize: 11,
        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #dee2e6',
        fontWeight: 600,
        textAlign: 'left' as const,
        whiteSpace: 'nowrap' as const,
        color: isDarkMode ? '#abb2bf' : '#495057'
      },
      td: {
        padding: '5px 8px',
        fontFamily: 'monospace',
        fontSize: 11,
        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f0f0f0',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const
      },
      tableRow: {
        cursor: 'pointer'
      },
      tableRowSelected: {
        backgroundColor: isDarkMode ? '#264f78' : '#e3f2fd'
      },
      compactPagination: {
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
        alignItems: 'center'
      },
      paginationButton: {
        padding: '4px 10px',
        border: isDarkMode ? '1px solid #3e3e3e' : '1px solid #ddd',
        backgroundColor: isDarkMode ? '#2d2d2d' : 'white',
        color: isDarkMode ? '#d4d4d4' : '#212529',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 11
      },
      pageInfo: {
        fontSize: 12,
        margin: '0 5px',
        color: isDarkMode ? '#abb2bf' : '#495057'
      },
      compactDetails: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 8,
        marginBottom: 12,
        fontSize: 12
      },
      detailLabel: {
        fontWeight: 600,
        color: isDarkMode ? '#abb2bf' : '#495057',
        minWidth: 70,
        display: 'inline-block'
      },
      noSelection: {
        textAlign: 'center' as const,
        padding: 30,
        color: isDarkMode ? '#abb2bf' : '#6c757d',
        fontSize: 12
      },
      filterHelp: {
        position: 'absolute' as const,
        top: '100%',
        left: 0,
        right: 0,
        background: isDarkMode ? '#2c2c2c' : '#fff3cd',
        border: isDarkMode ? '1px solid #3e3e3e' : '1px solid #ffeaa7',
        borderRadius: 3,
        padding: '6px 10px',
        marginTop: 3,
        fontSize: 11,
        color: isDarkMode ? '#d4d4d4' : '#856404',
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }
    }),
    [isDarkMode]
  )

  const styles = getStyles()

  return (
    <div style={styles.container}>
      <style>{`
        .collapsible-header { cursor: pointer; user-select: none; }
        .collapsible-header:hover { background-color: ${isDarkMode ? '#3a3a3a' : '#e9ecef'}; }
        .collapsible-content { overflow: hidden; transition: max-height 0.2s ease; }
        .collapsible-content.open { max-height: none; }
        .collapsible-content.closed { display: none; }
        .packets-table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 12px;
          table-layout: fixed;
        }
        .packets-table th { 
          position: sticky; 
          top: 0; 
          background: ${isDarkMode ? '#2d2d2d' : '#f8f9fa'}; 
          z-index: 10;
          padding: 6px 8px; 
          font-size: 11px; 
          border-bottom: ${isDarkMode ? '1px solid #333' : '1px solid #dee2e6'};
          font-weight: 600;
          text-align: left;
          white-space: nowrap;
          color: ${isDarkMode ? '#abb2bf' : '#495057'};
        }
        .packets-table td { 
          padding: 5px 8px; 
          font-family: monospace; 
          font-size: 11px; 
          border-bottom: ${isDarkMode ? '1px solid #333' : '1px solid #f0f0f0'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: ${isDarkMode ? '#d4d4d4' : '#212529'};
        }
        .packets-table tr:hover { background: ${isDarkMode ? '#2d2d2d' : '#f8f9fa'}; cursor: pointer; }
        .packets-table tr.selected { background: ${isDarkMode ? '#264f78' : '#e3f2fd'}; }
        .filter-help {
          position: absolute; top: 100%; left: 0; right: 0; 
          background: ${isDarkMode ? '#2c2c2c' : '#fff3cd'};
          border: ${isDarkMode ? '1px solid #3e3e3e' : '1px solid #ffeaa7'}; 
          border-radius: 3px; padding: 6px 10px;
          margin-top: 3px; font-size: 11px; color: ${isDarkMode ? '#d4d4d4' : '#856404'}; 
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .filter-help:before { content: '▲'; position: absolute; top: -7px; left: 15px; color: ${isDarkMode ? '#3e3e3e' : '#ffeaa7'}; font-size: 7px; }
      `}</style>

      {/* Информационная панель */}
      {pcapData && (
        <div style={styles.infoBar}>
          <span style={styles.infoBarItem}>📁 {fileName}</span>
          <span style={styles.infoBarItem}>📊 {pcapData.packets.length}</span>
          <span style={styles.infoBarItem}>
            {pcapData.header.isNanosecond
              ? '⚡ наносекунды'
              : '⏱️ микросекунды'}
          </span>
        </div>
      )}

      {loading && <div style={styles.loading}>⏳ Загрузка...</div>}
      {error && <div style={styles.error}>❌ {error}</div>}

      {!pcapData && !loading && !error && (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📭</div>
          <div style={styles.emptyStateText}>Нет данных</div>
        </div>
      )}

      {pcapData && !loading && (
        <div ref={mainContentRef} style={styles.scrollableContent}>
          {/* Раздел 1: Общая информация и таблица */}
          <div style={styles.section}>
            <div
              className="collapsible-header"
              style={styles.sectionHeader}
              onClick={() => setIsMainSectionOpen(!isMainSectionOpen)}
            >
              <span style={styles.sectionTitle}>
                {isMainSectionOpen ? '▼' : '►'} 📊 Пакеты
              </span>
              <span style={styles.sectionBadge}>{pcapData.packets.length}</span>
            </div>

            <div
              className={`collapsible-content ${isMainSectionOpen ? 'open' : 'closed'}`}
            >
              <div style={styles.sectionContent}>
                {/* Компактная информация о файле */}
                <div style={styles.compactInfo}>
                  <span>📄 {formatFileSize(0)}</span>
                  <span>
                    🔢 v{pcapData.header.versionMajor}.
                    {pcapData.header.versionMinor}
                  </span>
                  <span>🔌 {getNetworkType(pcapData.header.network)}</span>
                  <span>📏 {pcapData.header.snaplen} Б</span>
                  <span>
                    🔑 0x
                    {pcapData.header.magicNumber.toString(16).toUpperCase()}
                  </span>
                </div>

                {/* Фильтры */}
                <div style={styles.compactControls}>
                  <div style={{ flex: 2, position: 'relative' }}>
                    <input
                      type="text"
                      style={styles.filterInput}
                      placeholder="🔍 Фильтр пакетов..."
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                      onFocus={() => setShowFilterHelp(true)}
                      onBlur={() =>
                        setTimeout(() => setShowFilterHelp(false), 150)
                      }
                    />
                    {showFilterHelp && (
                      <div className="filter-help">
                        🔍 Поиск по IP, порту, протоколу (TCP, UDP, ICMP, ARP)
                        или тексту (SYN, ACK)
                      </div>
                    )}
                  </div>

                  <select
                    style={styles.protocolSelect}
                    value={protocolFilter}
                    onChange={(e) => {
                      setProtocolFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                  >
                    <option value="">Все протоколы</option>
                    {availableProtocols.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  <div style={styles.packetCount}>
                    📦 {sortedPackets.length}
                  </div>
                </div>

                {/* Таблица пакетов */}
                <div ref={tableContainerRef} style={styles.tableWrapper}>
                  <table className="packets-table">
                    <colgroup>
                      <col style={{ width: '40px' }} />
                      <col style={{ width: '60px' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '55px' }} />
                      <col style={{ width: '45px' }} />
                      <col style={{ width: 'auto' }} />
                    </colgroup>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th onClick={() => handleSort('index')}>#</th>
                        <th onClick={() => handleSort('timestamp')}>Время</th>
                        <th onClick={() => handleSort('source')}>Источник</th>
                        <th onClick={() => handleSort('destination')}>
                          Назначение
                        </th>
                        <th onClick={() => handleSort('protocol')}>Протокол</th>
                        <th onClick={() => handleSort('length')}>Размер</th>
                        <th>Информация</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPackets.map(
                        (packet) =>
                          packet.parsed && (
                            <tr
                              key={packet.index}
                              className={`packet-row-${packet.index} ${selectedPacket?.index === packet.index ? 'selected' : ''}`}
                              style={
                                selectedPacket?.index === packet.index
                                  ? styles.tableRowSelected
                                  : styles.tableRow
                              }
                              onClick={() => setSelectedPacket(packet)}
                            >
                              <td style={{ textAlign: 'right', ...styles.td }}>
                                {packet.index}
                              </td>
                              <td style={styles.td}>
                                {packet.parsed.timestamp.slice(11, 19)}
                              </td>
                              <td
                                style={styles.td}
                                title={packet.parsed.source}
                              >
                                {packet.parsed.source.length > 28
                                  ? packet.parsed.source.slice(0, 25) + '…'
                                  : packet.parsed.source}
                              </td>
                              <td
                                style={styles.td}
                                title={packet.parsed.destination}
                              >
                                {packet.parsed.destination.length > 28
                                  ? packet.parsed.destination.slice(0, 25) + '…'
                                  : packet.parsed.destination}
                              </td>
                              <td style={styles.td}>
                                {getProtocolIcon(packet.parsed.protocol)}{' '}
                                {packet.parsed.protocol}
                              </td>
                              <td style={{ textAlign: 'right', ...styles.td }}>
                                {packet.capturedLength}
                              </td>
                              <td style={styles.td} title={packet.parsed.info}>
                                {packet.parsed.info.length > 40
                                  ? packet.parsed.info.slice(0, 37) + '…'
                                  : packet.parsed.info}
                              </td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div style={styles.compactPagination}>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={styles.paginationButton}
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={styles.paginationButton}
                    >
                      ‹
                    </button>
                    <span style={styles.pageInfo}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      style={styles.paginationButton}
                    >
                      ›
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      style={styles.paginationButton}
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Раздел 2: Детали пакета */}
          <div style={styles.section}>
            <div
              className="collapsible-header"
              style={styles.sectionHeader}
              onClick={() => setIsPacketDetailsOpen(!isPacketDetailsOpen)}
            >
              <span style={styles.sectionTitle}>
                {isPacketDetailsOpen ? '▼' : '►'} 🔍 Детали пакета
              </span>
              {selectedPacket && (
                <span style={styles.sectionBadge}>#{selectedPacket.index}</span>
              )}
            </div>

            <div
              className={`collapsible-content ${isPacketDetailsOpen ? 'open' : 'closed'}`}
            >
              <div style={styles.sectionContent}>
                {selectedPacket && selectedPacket.parsed ? (
                  <>
                    <div style={styles.compactDetails}>
                      <div>
                        <span style={styles.detailLabel}>⏱️ Время:</span>{' '}
                        {selectedPacket.parsed.timestamp}
                      </div>
                      <div>
                        <span style={styles.detailLabel}>📡 Источник:</span>{' '}
                        {selectedPacket.parsed.source}
                      </div>
                      <div>
                        <span style={styles.detailLabel}>🎯 Назначение:</span>{' '}
                        {selectedPacket.parsed.destination}
                      </div>
                      <div>
                        <span style={styles.detailLabel}>🔧 Протокол:</span>{' '}
                        {selectedPacket.parsed.protocol}
                      </div>
                      <div>
                        <span style={styles.detailLabel}>📏 Размер:</span>{' '}
                        {selectedPacket.capturedLength} /{' '}
                        {selectedPacket.originalLength} байт
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <span style={styles.detailLabel}>ℹ️ Информация:</span>{' '}
                        {selectedPacket.parsed.info}
                      </div>
                    </div>
                    <HexDump
                      data={selectedPacket.data}
                      maxBytes={512}
                      isDarkMode={isDarkMode}
                    />
                  </>
                ) : (
                  <div style={styles.noSelection}>
                    ← Выберите пакет из таблицы выше
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
