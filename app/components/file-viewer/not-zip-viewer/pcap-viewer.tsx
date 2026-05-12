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

// Интерфейс для узлов дерева структуры пакета
interface PacketTreeNode {
  name: string
  value?: string | number
  children?: PacketTreeNode[]
  offset: number
  length: number
  bytes: Uint8Array
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

// Функции для парсинга заголовков
const formatMac = (mac: Uint8Array): string => {
  return Array.from(mac.slice(0, 6))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase()
}

const formatIpv4 = (ip: Uint8Array): string => {
  return Array.from(ip.slice(0, 4)).join('.')
}

const formatIpv6 = (ip: Uint8Array): string => {
  const parts: string[] = []
  for (let i = 0; i < 16; i += 2) {
    parts.push(((ip[i] << 8) | ip[i + 1]).toString(16))
  }
  return parts
    .join(':')
    .replace(/\b:?0+\b/g, '')
    .replace(/::+/g, '::')
}

const parseEthernetHeader = (
  data: Uint8Array,
  offset: number = 0
): EthernetHeader | null => {
  if (data.length < offset + 14) return null
  return {
    destMac: formatMac(data.subarray(offset, offset + 6)),
    srcMac: formatMac(data.subarray(offset + 6, offset + 12)),
    type: (data[offset + 12] << 8) | data[offset + 13]
  }
}

const parseIPv4Header = (
  data: Uint8Array,
  offset: number = 0
): IPv4Header | null => {
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
    srcAddr: formatIpv4(data.subarray(offset + 12, offset + 16)),
    destAddr: formatIpv4(data.subarray(offset + 16, offset + 20))
  }
}

const parseIPv6Header = (
  data: Uint8Array,
  offset: number = 0
): IPv6Header | null => {
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
    srcAddr: formatIpv6(data.subarray(offset + 8, offset + 24)),
    destAddr: formatIpv6(data.subarray(offset + 24, offset + 40))
  }
}

const parseTCPHeader = (
  data: Uint8Array,
  offset: number = 0
): TCPHeader | null => {
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

const parseUDPHeader = (
  data: Uint8Array,
  offset: number = 0
): UDPHeader | null => {
  if (data.length < offset + 8) return null
  return {
    srcPort: (data[offset] << 8) | data[offset + 1],
    destPort: (data[offset + 2] << 8) | data[offset + 3],
    length: (data[offset + 4] << 8) | data[offset + 5],
    checksum: (data[offset + 6] << 8) | data[offset + 7]
  }
}

const parseARPHeader = (
  data: Uint8Array,
  offset: number = 0
): ARPHeader | null => {
  if (data.length < offset + 28) return null
  return {
    hardwareType: (data[offset] << 8) | data[offset + 1],
    protocolType: (data[offset + 2] << 8) | data[offset + 3],
    hardwareSize: data[offset + 4],
    protocolSize: data[offset + 5],
    opcode: (data[offset + 6] << 8) | data[offset + 7],
    senderMac: formatMac(data.subarray(offset + 8, offset + 14)),
    senderIp: formatIpv4(data.subarray(offset + 14, offset + 18)),
    targetMac: formatMac(data.subarray(offset + 18, offset + 24)),
    targetIp: formatIpv4(data.subarray(offset + 24, offset + 28))
  }
}

const getTCPFlagsString = (flags: number): string => {
  const flagStrings: string[] = []
  if (flags & TCP_FLAGS.FIN) flagStrings.push('FIN')
  if (flags & TCP_FLAGS.SYN) flagStrings.push('SYN')
  if (flags & TCP_FLAGS.RST) flagStrings.push('RST')
  if (flags & TCP_FLAGS.PSH) flagStrings.push('PSH')
  if (flags & TCP_FLAGS.ACK) flagStrings.push('ACK')
  if (flags & TCP_FLAGS.URG) flagStrings.push('URG')
  return flagStrings.join(',')
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

class PacketParser {
  static parsePacket(data: Uint8Array, timestamp: number): PacketInfo {
    const date = new Date(timestamp * 1000)
    const timestampStr = date.toISOString().replace('T', ' ').slice(0, 23)
    const eth = parseEthernetHeader(data)
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
      const ipv4 = parseIPv4Header(data, 14)
      if (ipv4) {
        source = ipv4.srcAddr
        destination = ipv4.destAddr
        protocol = IP_PROTOCOLS[ipv4.protocol] || `Protocol ${ipv4.protocol}`
        protocolNumber = ipv4.protocol
        const ipOffset = 14 + ipv4.ihl * 4

        if (ipv4.protocol === 6) {
          const tcp = parseTCPHeader(data, ipOffset)
          if (tcp) {
            info = `${tcp.srcPort} → ${tcp.destPort} [${getTCPFlagsString(tcp.flags)}] Seq=${tcp.sequenceNumber}`
            source = `${source}:${tcp.srcPort}`
            destination = `${destination}:${tcp.destPort}`
          }
        } else if (ipv4.protocol === 17) {
          const udp = parseUDPHeader(data, ipOffset)
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
      const ipv6 = parseIPv6Header(data, 14)
      if (ipv6) {
        source = ipv6.srcAddr
        destination = ipv6.destAddr
        protocol =
          IP_PROTOCOLS[ipv6.nextHeader] || `Protocol ${ipv6.nextHeader}`
        protocolNumber = ipv6.nextHeader
        info = `IPv6, Hop Limit=${ipv6.hopLimit}`
      }
    } else if (etherType === 0x0806) {
      const arp = parseARPHeader(data, 14)
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

// Функция для сбора всех путей узлов дерева
const collectAllPaths = (
  node: PacketTreeNode,
  currentPath: string = node.name
): string[] => {
  const paths: string[] = [currentPath]
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      paths.push(...collectAllPaths(child, `${currentPath}.${child.name}.${i}`))
    }
  }
  return paths
}

// Компонент для построения дерева структуры пакета
const buildPacketTree = (packet: PcapPacket): PacketTreeNode | null => {
  const data = packet.data
  if (data.length < 14) return null

  let offset = 0
  const root: PacketTreeNode = {
    name: 'Frame',
    children: [],
    offset: 0,
    length: data.length,
    bytes: data
  }

  const eth = parseEthernetHeader(data, offset)
  if (!eth) return null

  const ethernetNode: PacketTreeNode = {
    name: 'Ethernet II',
    offset,
    length: 14,
    bytes: data.slice(offset, offset + 14),
    children: [
      {
        name: 'Destination',
        value: eth.destMac,
        offset,
        length: 6,
        bytes: data.slice(offset, offset + 6)
      },
      {
        name: 'Source',
        value: eth.srcMac,
        offset: offset + 6,
        length: 6,
        bytes: data.slice(offset + 6, offset + 12)
      },
      {
        name: 'Type',
        value: `0x${eth.type.toString(16).padStart(4, '0')} (${ETHER_TYPES[eth.type] || 'Unknown'})`,
        offset: offset + 12,
        length: 2,
        bytes: data.slice(offset + 12, offset + 14)
      }
    ]
  }
  root.children!.push(ethernetNode)
  offset += 14

  if (eth.type === 0x0800) {
    const ipv4 = parseIPv4Header(data, offset)
    if (ipv4) {
      const ipv4Node: PacketTreeNode = {
        name: 'Internet Protocol Version 4',
        offset,
        length: ipv4.ihl * 4,
        bytes: data.slice(offset, offset + ipv4.ihl * 4),
        children: [
          {
            name: 'Version',
            value: ipv4.version,
            offset,
            length: 1,
            bytes: data.slice(offset, offset + 1)
          },
          {
            name: 'Header Length',
            value: `${ipv4.ihl * 4} bytes (${ipv4.ihl})`,
            offset,
            length: 1,
            bytes: data.slice(offset, offset + 1)
          },
          {
            name: 'Differentiated Services Field',
            value: `0x${ipv4.tos.toString(16).padStart(2, '0')}`,
            offset: offset + 1,
            length: 1,
            bytes: data.slice(offset + 1, offset + 2)
          },
          {
            name: 'Total Length',
            value: ipv4.totalLength,
            offset: offset + 2,
            length: 2,
            bytes: data.slice(offset + 2, offset + 4)
          },
          {
            name: 'Identification',
            value: `0x${ipv4.identification.toString(16).padStart(4, '0')} (${ipv4.identification})`,
            offset: offset + 4,
            length: 2,
            bytes: data.slice(offset + 4, offset + 6)
          },
          {
            name: 'Flags',
            value: `0x${ipv4.flags.toString(16)}`,
            offset: offset + 6,
            length: 1,
            bytes: data.slice(offset + 6, offset + 7),
            children: [
              {
                name: 'Reserved bit',
                value: (ipv4.flags >> 2) & 1 ? 'Set' : 'Not set',
                offset: offset + 6,
                length: 1,
                bytes: data.slice(offset + 6, offset + 7)
              },
              {
                name: "Don't fragment",
                value: (ipv4.flags >> 1) & 1 ? 'Set' : 'Not set',
                offset: offset + 6,
                length: 1,
                bytes: data.slice(offset + 6, offset + 7)
              },
              {
                name: 'More fragments',
                value: ipv4.flags & 1 ? 'Set' : 'Not set',
                offset: offset + 6,
                length: 1,
                bytes: data.slice(offset + 6, offset + 7)
              }
            ]
          },
          {
            name: 'Fragment Offset',
            value: ipv4.fragmentOffset,
            offset: offset + 6,
            length: 2,
            bytes: data.slice(offset + 6, offset + 8)
          },
          {
            name: 'Time to Live',
            value: ipv4.ttl,
            offset: offset + 8,
            length: 1,
            bytes: data.slice(offset + 8, offset + 9)
          },
          {
            name: 'Protocol',
            value: `${IP_PROTOCOLS[ipv4.protocol] || 'Unknown'} (${ipv4.protocol})`,
            offset: offset + 9,
            length: 1,
            bytes: data.slice(offset + 9, offset + 10)
          },
          {
            name: 'Header Checksum',
            value: `0x${ipv4.checksum.toString(16).padStart(4, '0')}`,
            offset: offset + 10,
            length: 2,
            bytes: data.slice(offset + 10, offset + 12)
          },
          {
            name: 'Source Address',
            value: ipv4.srcAddr,
            offset: offset + 12,
            length: 4,
            bytes: data.slice(offset + 12, offset + 16)
          },
          {
            name: 'Destination Address',
            value: ipv4.destAddr,
            offset: offset + 16,
            length: 4,
            bytes: data.slice(offset + 16, offset + 20)
          }
        ]
      }

      const ipHeaderLength = ipv4.ihl * 4
      if (ipHeaderLength > 20) {
        ipv4Node.children!.push({
          name: 'Options',
          offset: offset + 20,
          length: ipHeaderLength - 20,
          bytes: data.slice(offset + 20, offset + ipHeaderLength),
          children: []
        })
      }

      root.children!.push(ipv4Node)
      offset += ipHeaderLength

      if (ipv4.protocol === 6) {
        const tcp = parseTCPHeader(data, offset)
        if (tcp) {
          const tcpNode: PacketTreeNode = {
            name: 'Transmission Control Protocol',
            offset,
            length: tcp.dataOffset * 4,
            bytes: data.slice(offset, offset + tcp.dataOffset * 4),
            children: [
              {
                name: 'Source Port',
                value: tcp.srcPort,
                offset,
                length: 2,
                bytes: data.slice(offset, offset + 2)
              },
              {
                name: 'Destination Port',
                value: tcp.destPort,
                offset: offset + 2,
                length: 2,
                bytes: data.slice(offset + 2, offset + 4)
              },
              {
                name: 'Sequence Number',
                value: tcp.sequenceNumber,
                offset: offset + 4,
                length: 4,
                bytes: data.slice(offset + 4, offset + 8)
              },
              {
                name: 'Acknowledgment Number',
                value: tcp.acknowledgmentNumber,
                offset: offset + 8,
                length: 4,
                bytes: data.slice(offset + 8, offset + 12)
              },
              {
                name: 'Header Length',
                value: `${tcp.dataOffset * 4} bytes (${tcp.dataOffset})`,
                offset: offset + 12,
                length: 1,
                bytes: data.slice(offset + 12, offset + 13)
              },
              {
                name: 'Flags',
                value: `0x${tcp.flags.toString(16).padStart(2, '0')}`,
                offset: offset + 13,
                length: 1,
                bytes: data.slice(offset + 13, offset + 14),
                children: [
                  {
                    name: 'CWR',
                    value: tcp.flags & TCP_FLAGS.CWR ? 'Set' : 'Not set',
                    offset: offset + 13,
                    length: 1,
                    bytes: data.slice(offset + 13, offset + 14)
                  },
                  {
                    name: 'ECE',
                    value: tcp.flags & TCP_FLAGS.ECE ? 'Set' : 'Not set',
                    offset: offset + 13,
                    length: 1,
                    bytes: data.slice(offset + 13, offset + 14)
                  },
                  {
                    name: 'URG',
                    value: tcp.flags & TCP_FLAGS.URG ? 'Set' : 'Not set',
                    offset: offset + 13,
                    length: 1,
                    bytes: data.slice(offset + 13, offset + 14)
                  },
                  {
                    name: 'ACK',
                    value: tcp.flags & TCP_FLAGS.ACK ? 'Set' : 'Not set',
                    offset: offset + 13,
                    length: 1,
                    bytes: data.slice(offset + 13, offset + 14)
                  },
                  {
                    name: 'PSH',
                    value: tcp.flags & TCP_FLAGS.PSH ? 'Set' : 'Not set',
                    offset: offset + 13,
                    length: 1,
                    bytes: data.slice(offset + 13, offset + 14)
                  },
                  {
                    name: 'RST',
                    value: tcp.flags & TCP_FLAGS.RST ? 'Set' : 'Not set',
                    offset: offset + 13,
                    length: 1,
                    bytes: data.slice(offset + 13, offset + 14)
                  },
                  {
                    name: 'SYN',
                    value: tcp.flags & TCP_FLAGS.SYN ? 'Set' : 'Not set',
                    offset: offset + 13,
                    length: 1,
                    bytes: data.slice(offset + 13, offset + 14)
                  },
                  {
                    name: 'FIN',
                    value: tcp.flags & TCP_FLAGS.FIN ? 'Set' : 'Not set',
                    offset: offset + 13,
                    length: 1,
                    bytes: data.slice(offset + 13, offset + 14)
                  }
                ]
              },
              {
                name: 'Window',
                value: tcp.window,
                offset: offset + 14,
                length: 2,
                bytes: data.slice(offset + 14, offset + 16)
              },
              {
                name: 'Checksum',
                value: `0x${tcp.checksum.toString(16).padStart(4, '0')}`,
                offset: offset + 16,
                length: 2,
                bytes: data.slice(offset + 16, offset + 18)
              },
              {
                name: 'Urgent Pointer',
                value: tcp.urgentPointer,
                offset: offset + 18,
                length: 2,
                bytes: data.slice(offset + 18, offset + 20)
              }
            ]
          }

          const tcpHeaderLength = tcp.dataOffset * 4
          if (tcpHeaderLength > 20) {
            tcpNode.children!.push({
              name: 'TCP Options',
              offset: offset + 20,
              length: tcpHeaderLength - 20,
              bytes: data.slice(offset + 20, offset + tcpHeaderLength),
              children: []
            })
          }

          root.children!.push(tcpNode)
          offset += tcpHeaderLength

          if (offset < ipv4.totalLength) {
            root.children!.push({
              name: 'TCP Payload',
              value: `${data.length - offset} bytes`,
              offset,
              length: data.length - offset,
              bytes: data.slice(offset)
            })
          }
        }
      } else if (ipv4.protocol === 17) {
        const udp = parseUDPHeader(data, offset)
        if (udp) {
          const udpNode: PacketTreeNode = {
            name: 'User Datagram Protocol',
            offset,
            length: 8,
            bytes: data.slice(offset, offset + 8),
            children: [
              {
                name: 'Source Port',
                value: udp.srcPort,
                offset,
                length: 2,
                bytes: data.slice(offset, offset + 2)
              },
              {
                name: 'Destination Port',
                value: udp.destPort,
                offset: offset + 2,
                length: 2,
                bytes: data.slice(offset + 2, offset + 4)
              },
              {
                name: 'Length',
                value: udp.length,
                offset: offset + 4,
                length: 2,
                bytes: data.slice(offset + 4, offset + 6)
              },
              {
                name: 'Checksum',
                value: `0x${udp.checksum.toString(16).padStart(4, '0')}`,
                offset: offset + 6,
                length: 2,
                bytes: data.slice(offset + 6, offset + 8)
              }
            ]
          }
          root.children!.push(udpNode)
          offset += 8

          if (offset < ipv4.totalLength) {
            root.children!.push({
              name: 'UDP Payload',
              value: `${data.length - offset} bytes`,
              offset,
              length: data.length - offset,
              bytes: data.slice(offset)
            })
          }
        }
      } else if (ipv4.protocol === 1) {
        root.children!.push({
          name: 'Internet Control Message Protocol',
          offset,
          length: data.length - offset,
          bytes: data.slice(offset)
        })
      }
    }
  } else if (eth.type === 0x86dd) {
    const ipv6 = parseIPv6Header(data, offset)
    if (ipv6) {
      const ipv6Node: PacketTreeNode = {
        name: 'Internet Protocol Version 6',
        offset,
        length: 40,
        bytes: data.slice(offset, offset + 40),
        children: [
          {
            name: 'Version',
            value: ipv6.version,
            offset,
            length: 1,
            bytes: data.slice(offset, offset + 1)
          },
          {
            name: 'Traffic Class',
            value: `0x${ipv6.trafficClass.toString(16).padStart(2, '0')}`,
            offset,
            length: 1,
            bytes: data.slice(offset, offset + 1)
          },
          {
            name: 'Flow Label',
            value: `0x${ipv6.flowLabel.toString(16)}`,
            offset,
            length: 4,
            bytes: data.slice(offset, offset + 4)
          },
          {
            name: 'Payload Length',
            value: ipv6.payloadLength,
            offset: offset + 4,
            length: 2,
            bytes: data.slice(offset + 4, offset + 6)
          },
          {
            name: 'Next Header',
            value: `${IP_PROTOCOLS[ipv6.nextHeader] || 'Unknown'} (${ipv6.nextHeader})`,
            offset: offset + 6,
            length: 1,
            bytes: data.slice(offset + 6, offset + 7)
          },
          {
            name: 'Hop Limit',
            value: ipv6.hopLimit,
            offset: offset + 7,
            length: 1,
            bytes: data.slice(offset + 7, offset + 8)
          },
          {
            name: 'Source Address',
            value: ipv6.srcAddr,
            offset: offset + 8,
            length: 16,
            bytes: data.slice(offset + 8, offset + 24)
          },
          {
            name: 'Destination Address',
            value: ipv6.destAddr,
            offset: offset + 24,
            length: 16,
            bytes: data.slice(offset + 24, offset + 40)
          }
        ]
      }
      root.children!.push(ipv6Node)
    }
  } else if (eth.type === 0x0806) {
    const arp = parseARPHeader(data, offset)
    if (arp) {
      const arpNode: PacketTreeNode = {
        name: 'Address Resolution Protocol',
        offset,
        length: 28,
        bytes: data.slice(offset, offset + 28),
        children: [
          {
            name: 'Hardware Type',
            value: arp.hardwareType === 1 ? 'Ethernet (1)' : arp.hardwareType,
            offset,
            length: 2,
            bytes: data.slice(offset, offset + 2)
          },
          {
            name: 'Protocol Type',
            value: `0x${arp.protocolType.toString(16).padStart(4, '0')} (IPv4)`,
            offset: offset + 2,
            length: 2,
            bytes: data.slice(offset + 2, offset + 4)
          },
          {
            name: 'Hardware Size',
            value: arp.hardwareSize,
            offset: offset + 4,
            length: 1,
            bytes: data.slice(offset + 4, offset + 5)
          },
          {
            name: 'Protocol Size',
            value: arp.protocolSize,
            offset: offset + 5,
            length: 1,
            bytes: data.slice(offset + 5, offset + 6)
          },
          {
            name: 'Opcode',
            value: `${ARP_OPERATIONS[arp.opcode] || 'Unknown'} (${arp.opcode})`,
            offset: offset + 6,
            length: 2,
            bytes: data.slice(offset + 6, offset + 8)
          },
          {
            name: 'Sender MAC Address',
            value: arp.senderMac,
            offset: offset + 8,
            length: 6,
            bytes: data.slice(offset + 8, offset + 14)
          },
          {
            name: 'Sender IP Address',
            value: arp.senderIp,
            offset: offset + 14,
            length: 4,
            bytes: data.slice(offset + 14, offset + 18)
          },
          {
            name: 'Target MAC Address',
            value: arp.targetMac,
            offset: offset + 18,
            length: 6,
            bytes: data.slice(offset + 18, offset + 24)
          },
          {
            name: 'Target IP Address',
            value: arp.targetIp,
            offset: offset + 24,
            length: 4,
            bytes: data.slice(offset + 24, offset + 28)
          }
        ]
      }
      root.children!.push(arpNode)
    }
  }

  return root
}

// Компонент древовидной структуры пакета
const PacketDetailsTree: React.FC<{
  packet: PcapPacket
  isDarkMode?: boolean
  onNodeSelect?: (offset: number, length: number) => void
  selectedOffset?: number | null
}> = ({ packet, isDarkMode = false, onNodeSelect, selectedOffset }) => {
  const tree = React.useMemo(() => buildPacketTree(packet), [packet])

  // Собираем все пути для начального развернутого состояния
  const initialExpandedPaths = React.useMemo(() => {
    if (!tree) return new Set<string>()
    const allPaths = collectAllPaths(tree)
    return new Set(allPaths)
  }, [tree])

  const [expandedNodes, setExpandedNodes] =
    React.useState<Set<string>>(initialExpandedPaths)

  // Обновляем expandedNodes при изменении дерева
  React.useEffect(() => {
    if (tree) {
      const allPaths = collectAllPaths(tree)
      setExpandedNodes(new Set(allPaths))
    }
  }, [tree])

  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const renderTreeNode = (
    node: PacketTreeNode,
    depth: number = 0,
    path: string = node.name
  ) => {
    const isExpanded = expandedNodes.has(path)
    const hasChildren = node.children && node.children.length > 0
    const isSelected =
      selectedOffset !== null &&
      selectedOffset !== undefined &&
      selectedOffset >= node.offset &&
      selectedOffset < node.offset + node.length

    return (
      <div key={path}>
        <div
          style={{
            paddingLeft: depth * 20,
            paddingTop: 2,
            paddingBottom: 2,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: isSelected
              ? isDarkMode
                ? '#264f78'
                : '#e3f2fd'
              : 'transparent',
            borderLeft: isSelected
              ? `3px solid ${isDarkMode ? '#0078d4' : '#0078d4'}`
              : '3px solid transparent',
            fontSize: 11,
            fontFamily: 'monospace'
          }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(path)
            }
            onNodeSelect?.(node.offset, node.length)
          }}
        >
          <span style={{ marginRight: 4, fontSize: 10, minWidth: 16 }}>
            {hasChildren ? (isExpanded ? '▼' : '▶') : '  '}
          </span>
          <span style={{ fontWeight: 600, minWidth: 200 }}>{node.name}</span>
          {node.value !== undefined && (
            <span
              style={{
                marginLeft: 12,
                color: isDarkMode ? '#98c379' : '#22863a'
              }}
            >
              {node.value}
            </span>
          )}
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 9,
              color: isDarkMode ? '#858585' : '#57606a'
            }}
          >
            [{node.offset}:{node.offset + node.length}]
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child, idx) =>
              renderTreeNode(child, depth + 1, `${path}.${child.name}.${idx}`)
            )}
          </div>
        )}
      </div>
    )
  }

  if (!tree)
    return (
      <div style={{ padding: 10, color: isDarkMode ? '#abb2bf' : '#6c757d' }}>
        Не удалось разобрать структуру пакета
      </div>
    )

  return (
    <div
      style={{
        maxHeight: 400,
        overflowY: 'auto',
        border: isDarkMode ? '1px solid #333' : '1px solid #dee2e6',
        borderRadius: 4,
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff'
      }}
    >
      {renderTreeNode(tree)}
    </div>
  )
}

// Компонент HexDump с поддержкой темной темы и подсветкой выбранного поля
const HexDump: React.FC<{
  data: Uint8Array
  maxBytes?: number
  isDarkMode?: boolean
  highlightOffset?: number | null
  highlightLength?: number
}> = ({
  data,
  maxBytes = 512,
  isDarkMode = false,
  highlightOffset = null,
  highlightLength = 1
}) => {
  const [copyStatus, setCopyStatus] = React.useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [hoveredByte, setHoveredByte] = React.useState<number | null>(null)

  const displayData = React.useMemo(() => {
    const bytes = data.slice(0, maxBytes)
    const isTruncated = data.length > maxBytes

    const getByteColor = (
      offset: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      value: number
    ): { color: string; type: string } => {
      if (
        highlightOffset !== null &&
        offset >= highlightOffset &&
        offset < highlightOffset + highlightLength
      ) {
        return { color: '#f0ad4e', type: 'Selected Field' }
      }

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
          color,
          type
        })
      }

      lines.push({ offset: i.toString(16).padStart(6, '0'), bytes: byteItems })
    }

    return { lines, isTruncated, totalBytes: data.length }
  }, [data, maxBytes, highlightOffset, highlightLength])

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

  const hexStyles = {
    container: {
      fontFamily: 'Monaco, Menlo, monospace',
      fontSize: 11,
      background: isDarkMode ? '#1e1e1e' : '#ffffff',
      color: isDarkMode ? '#d4d4d4' : '#212529',
      padding: '6px 8px',
      borderRadius: 4,
      overflow: 'hidden',
      border: isDarkMode ? '1px solid #333' : '1px solid #d0d7de'
    },
    toolbar: {
      display: 'flex',
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
    success: { color: isDarkMode ? '#98c379' : '#22863a', fontSize: 10 },
    error: { color: isDarkMode ? '#e06c75' : '#dc2626', fontSize: 10 },
    legend: {
      display: 'flex',
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
      maxHeight: 400,
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
    bytes: { display: 'inline-flex', flexWrap: 'nowrap' as const, gap: 1 },
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
        <button onClick={() => void copyAllHex()} style={hexStyles.button}>
          📋 Копировать все HEX
        </button>
        <button onClick={() => void copyAsCArray()} style={hexStyles.button}>
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
        <span style={{ color: '#f0ad4e' }}>● Выбранное поле</span>
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
                    backgroundColor:
                      hoveredByte === byte.offset
                        ? isDarkMode
                          ? '#3a3a3a'
                          : '#d0d7de'
                        : 'transparent',
                    fontWeight: hoveredByte === byte.offset ? 'bold' : 'normal'
                  }}
                  onMouseEnter={() => setHoveredByte(byte.offset)}
                  onMouseLeave={() => setHoveredByte(null)}
                  onClick={() => void navigator.clipboard.writeText(byte.value)}
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
  const [selectedOffset, setSelectedOffset] = React.useState<number | null>(
    null
  )
  const [selectedLength, setSelectedLength] = React.useState<number>(1)
  const [activeTab, setActiveTab] = React.useState<'structure' | 'hex'>(
    'structure'
  )

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

  const handleNodeSelect = (offset: number, length: number) => {
    setSelectedOffset(offset)
    setSelectedLength(length)
  }

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
      infoBarItem: { color: isDarkMode ? '#abb2bf' : '#495057' },
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
      emptyStateIcon: { fontSize: 48 },
      emptyStateText: { fontSize: 13 },
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
        color: isDarkMode ? '#d4d4d4' : '#212529',
        cursor: 'pointer'
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
      tableHeader: { backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa' },
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
        color: isDarkMode ? '#abb2bf' : '#495057',
        cursor: 'pointer'
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
      tableRow: { cursor: 'pointer' },
      tableRowSelected: { backgroundColor: isDarkMode ? '#264f78' : '#e3f2fd' },
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
      },
      tabs: {
        display: 'flex',
        gap: 0,
        marginBottom: 12,
        borderBottom: isDarkMode ? '1px solid #333' : '1px solid #dee2e6'
      },
      tab: {
        padding: '8px 16px',
        fontSize: 12,
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        color: isDarkMode ? '#abb2bf' : '#495057',
        borderBottom: '2px solid transparent',
        transition: 'all 0.2s'
      },
      tabActive: {
        color: isDarkMode ? '#0078d4' : '#0078d4',
        borderBottomColor: isDarkMode ? '#0078d4' : '#0078d4'
      }
    }),
    [isDarkMode]
  )

  const styles = getStyles()

  return (
    <div style={styles.container}>
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
              style={styles.sectionHeader}
              onClick={() => setIsMainSectionOpen(!isMainSectionOpen)}
            >
              <span style={styles.sectionTitle}>
                {isMainSectionOpen ? '▼' : '►'} 📊 Пакеты
              </span>
              <span style={styles.sectionBadge}>{pcapData.packets.length}</span>
            </div>

            {isMainSectionOpen && (
              <div style={styles.sectionContent}>
                <div style={styles.compactInfo}>
                  <span>📄 {formatFileSize(pcapBlob?.size || 0)}</span>
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

                <div ref={tableContainerRef} style={styles.tableWrapper}>
                  <table style={styles.table}>
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
                        <th
                          style={styles.th}
                          onClick={() => handleSort('index')}
                        >
                          #
                        </th>
                        <th
                          style={styles.th}
                          onClick={() => handleSort('timestamp')}
                        >
                          Время
                        </th>
                        <th
                          style={styles.th}
                          onClick={() => handleSort('source')}
                        >
                          Источник
                        </th>
                        <th
                          style={styles.th}
                          onClick={() => handleSort('destination')}
                        >
                          Назначение
                        </th>
                        <th
                          style={styles.th}
                          onClick={() => handleSort('protocol')}
                        >
                          Протокол
                        </th>
                        <th
                          style={styles.th}
                          onClick={() => handleSort('length')}
                        >
                          Размер
                        </th>
                        <th style={styles.th}>Информация</th>
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
            )}
          </div>

          {/* Раздел 2: Детали пакета с вкладками */}
          <div style={styles.section}>
            <div
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

            {isPacketDetailsOpen && (
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

                    {/* Вкладки */}
                    <div style={styles.tabs}>
                      <button
                        style={{
                          ...styles.tab,
                          ...(activeTab === 'structure' ? styles.tabActive : {})
                        }}
                        onClick={() => setActiveTab('structure')}
                      >
                        📋 Структура кадра
                      </button>
                      <button
                        style={{
                          ...styles.tab,
                          ...(activeTab === 'hex' ? styles.tabActive : {})
                        }}
                        onClick={() => setActiveTab('hex')}
                      >
                        🔢 HEX представление
                      </button>
                    </div>

                    {/* Содержимое вкладок */}
                    {activeTab === 'structure' && (
                      <PacketDetailsTree
                        packet={selectedPacket}
                        isDarkMode={isDarkMode}
                        onNodeSelect={handleNodeSelect}
                        selectedOffset={selectedOffset}
                      />
                    )}

                    {activeTab === 'hex' && (
                      <HexDump
                        data={selectedPacket.data}
                        maxBytes={512}
                        isDarkMode={isDarkMode}
                        highlightOffset={selectedOffset}
                        highlightLength={selectedLength}
                      />
                    )}
                  </>
                ) : (
                  <div style={styles.noSelection}>
                    ← Выберите пакет из таблицы выше
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
