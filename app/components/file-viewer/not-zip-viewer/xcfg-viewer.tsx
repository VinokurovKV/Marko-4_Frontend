// React
import * as React from 'react'
// Other
import { unzlibSync } from 'fflate'

interface XcfgFileViewerProps {
  blob?: Blob | null
  fileName?: string
  isDarkMode?: boolean
}

type ScalarValue =
  | string
  | number
  | boolean
  | null
  | ScalarValue[]
  | { [key: string]: ScalarValue }

interface XcfgBlock {
  index: number
  startOffset: number
  endOffset: number
  rawSize: number
  decompressedSize: number
  kind: string
  payload?: Uint8Array
  error?: string
}

interface WireField {
  number: number
  wireType: number
  value: number | Uint8Array
}

interface XcfgObject {
  handle: string
  className: string
  upper?: string
  props: Record<string, ScalarValue>
  updates: Array<Record<string, ScalarValue>>
  children: string[]
  relations: Record<string, string[]>
  sourceBlock?: number
}

interface XcfgModel {
  source: 'xcfg'
  objects: Map<string, XcfgObject>
  warnings: string[]
}

interface ParsedXcfg {
  blocks: XcfgBlock[]
  model: XcfgModel
  fileSize: number
}

interface ProtocolField {
  path: string
  value: string
  attributes: Record<string, string>
}

interface ProtocolInfo {
  name: string
  type: string
  fields: ProtocolField[]
}

interface ModifierInfo {
  name: string
  values: Record<string, ScalarValue>
}

interface TemplateDetails {
  protocols: ProtocolInfo[]
  modifiers: ModifierInfo[]
  error?: string
}

type TabId =
  | 'overview'
  | 'ports'
  | 'streams'
  | 'vpn'
  | 'diagnostics'
  | 'objects'

const SEPARATOR_TEXT = '####xinertel Renix config sep####\n'
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder('utf-8')
const separatorBytes = textEncoder.encode(SEPARATOR_TEXT)

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'ports', label: 'Ports' },
  { id: 'streams', label: 'Streams' },
  { id: 'vpn', label: 'VPN / VRF' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'objects', label: 'Objects' }
]

export const XcfgFileViewer: React.FC<XcfgFileViewerProps> = ({
  blob,
  fileName,
  isDarkMode = false
}) => {
  const [activeTab, setActiveTab] = React.useState<TabId>('overview')
  const [query, setQuery] = React.useState('')
  const [selectedHandle, setSelectedHandle] = React.useState<string | null>(
    null
  )
  const [state, setState] = React.useState<{
    status: 'idle' | 'loading' | 'ready' | 'error'
    parsed?: ParsedXcfg
    error?: string
  }>({ status: blob ? 'loading' : 'idle' })

  const palette = React.useMemo(() => makePalette(isDarkMode), [isDarkMode])
  const styles = React.useMemo(() => makeStyles(palette), [palette])

  React.useEffect(() => {
    let cancelled = false

    if (!blob) {
      setState({ status: 'idle' })
      setSelectedHandle(null)
      return
    }

    setState({ status: 'loading' })
    setSelectedHandle(null)

    parseXcfgBlob(blob)
      .then((parsed) => {
        if (!cancelled) {
          setState({ status: 'ready', parsed })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [blob])

  const model = state.parsed?.model
  const objects = model ? objectsSorted(model) : []
  const selectedObject =
    selectedHandle && model ? model.objects.get(selectedHandle) : undefined
  const metrics =
    model && state.parsed
      ? getMetrics(model, state.parsed.blocks, state.parsed.fileSize)
      : null
  const filteredObjects = React.useMemo(() => {
    if (!query.trim()) {
      return objects.slice(0, 250)
    }
    const needle = query.trim().toLowerCase()
    return objects
      .filter((obj) => {
        const props = mergedProps(obj)
        return (
          obj.handle.toLowerCase().includes(needle) ||
          obj.className.toLowerCase().includes(needle) ||
          objectName(obj).toLowerCase().includes(needle) ||
          Object.values(props).some((value) =>
            formatValue(value, 180).toLowerCase().includes(needle)
          )
        )
      })
      .slice(0, 250)
  }, [objects, query])

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>Xinertel Renix</div>
          <h2 style={styles.title}>{fileName || 'XCFG File Viewer'}</h2>
        </div>
        <StatusPill status={state.status} palette={palette} />
      </div>

      {!blob && <div style={styles.emptyState}>No XCFG file selected.</div>}

      {state.status === 'loading' && (
        <div style={styles.emptyState}>Parsing XCFG...</div>
      )}

      {state.status === 'error' && (
        <div style={styles.errorBox}>{state.error}</div>
      )}

      {state.status === 'ready' && model && state.parsed && metrics && (
        <>
          <div style={styles.metricsGrid}>
            <Metric label="Objects" value={metrics.objects} styles={styles} />
            <Metric
              label="Blocks"
              value={metrics.blocks}
              subValue={`${metrics.failedBlocks} failed`}
              styles={styles}
            />
            <Metric label="Ports" value={metrics.ports} styles={styles} />
            <Metric label="Streams" value={metrics.streams} styles={styles} />
            <Metric label="VRFs" value={metrics.vrfs} styles={styles} />
            <Metric
              label="Size"
              value={formatBytes(metrics.fileSize)}
              styles={styles}
            />
          </div>

          <div role="tablist" aria-label="XCFG sections" style={styles.tabList}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id ? styles.activeTab : styles.tab}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={styles.contentPanel}>
            {activeTab === 'overview' && (
              <OverviewTab
                parsed={state.parsed}
                styles={styles}
                model={model}
              />
            )}
            {activeTab === 'ports' && (
              <PortsTab model={model} styles={styles} />
            )}
            {activeTab === 'streams' && (
              <StreamsTab model={model} styles={styles} />
            )}
            {activeTab === 'vpn' && <VpnTab model={model} styles={styles} />}
            {activeTab === 'diagnostics' && (
              <DiagnosticsTab parsed={state.parsed} styles={styles} />
            )}
            {activeTab === 'objects' && (
              <ObjectsTab
                model={model}
                objects={filteredObjects}
                query={query}
                selectedObject={selectedObject}
                onQueryChange={setQuery}
                onSelect={setSelectedHandle}
                styles={styles}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

const OverviewTab: React.FC<{
  parsed: ParsedXcfg
  model: XcfgModel
  styles: ViewerStyles
}> = ({ parsed, model, styles }) => {
  const sysEntry = objectsByClass(model, 'SysEntry')[0]
  const sysProps = sysEntry ? mergedProps(sysEntry) : {}
  const classCounts = getClassCounts(model).slice(0, 24)
  const blockKinds = getBlockKindCounts(parsed.blocks)

  return (
    <div style={styles.stack}>
      <section style={styles.section}>
        <SectionTitle title="Decode Summary" styles={styles} />
        <DataTable
          styles={styles}
          rows={[
            ['Source mode', model.source],
            ['File size', formatBytes(parsed.fileSize)],
            ['Blocks', String(parsed.blocks.length)],
            [
              'Decompressed',
              String(parsed.blocks.filter((block) => !block.error).length)
            ],
            [
              'Failed',
              String(parsed.blocks.filter((block) => block.error).length)
            ],
            ['Objects', String(model.objects.size)]
          ]}
          columns={['Field', 'Value']}
        />
      </section>

      <section style={styles.section}>
        <SectionTitle title="Test Metadata" styles={styles} />
        <DataTable
          styles={styles}
          rows={[
            'Name',
            'Version',
            'ConfigFileVersion',
            'VersionType',
            'ProductType',
            'TestCaseName'
          ]
            .filter((key) => sysProps[key] !== undefined)
            .map((key) => [key, formatValue(sysProps[key])])}
          columns={['Field', 'Value']}
        />
      </section>

      <section style={styles.twoColumnSection}>
        <div>
          <SectionTitle title="Object Classes" styles={styles} />
          <DataTable
            styles={styles}
            rows={classCounts.map(([className, count]) => [
              className,
              String(count)
            ])}
            columns={['Class', 'Count']}
            numericColumns={[1]}
          />
        </div>
        <div>
          <SectionTitle title="Payload Kinds" styles={styles} />
          <DataTable
            styles={styles}
            rows={Array.from(blockKinds.entries()).map(([kind, count]) => [
              kind,
              String(count)
            ])}
            columns={['Kind', 'Count']}
            numericColumns={[1]}
          />
        </div>
      </section>
    </div>
  )
}

const PortsTab: React.FC<{ model: XcfgModel; styles: ViewerStyles }> = ({
  model,
  styles
}) => {
  const ports = objectsByClass(model, 'Port')

  return (
    <section style={styles.section}>
      <SectionTitle title="Ports" styles={styles} />
      <DataTable
        styles={styles}
        rows={ports.map((port) => {
          const props = mergedProps(port)
          return [
            objectName(port),
            port.handle,
            formatValue(props.Location),
            formatValue(props.LocationEffect ?? props.Enable),
            formatValue(props.PortCfgType),
            String(port.children.length)
          ]
        })}
        columns={['Name', 'Handle', 'Location', 'Enabled', 'Type', 'Children']}
        numericColumns={[5]}
      />
    </section>
  )
}

const StreamsTab: React.FC<{ model: XcfgModel; styles: ViewerStyles }> = ({
  model,
  styles
}) => {
  const streams = objectsByClass(model, 'StreamTemplate')
  const templateSources = getTemplateSources(model)

  return (
    <div style={styles.stack}>
      <section style={styles.section}>
        <SectionTitle title="Stream Templates" styles={styles} />
        <DataTable
          styles={styles}
          rows={streams.map((stream) => {
            const props = mergedProps(stream)
            return [
              objectName(stream),
              stream.handle,
              displayName(model, stream.upper),
              formatValue(props.StreamFlowCount),
              formatValue(props.StreamInterCount),
              formatValue(props.ROMTag)
            ]
          })}
          columns={[
            'Stream',
            'Handle',
            'Port',
            'Flow Count',
            'Inter Count',
            'Tag'
          ]}
          numericColumns={[3, 4]}
        />
      </section>

      <section style={styles.section}>
        <SectionTitle title="Protocol Stacks" styles={styles} />
        <div style={styles.protocolList}>
          {templateSources.length === 0 && (
            <div style={styles.emptyState}>No template XML found.</div>
          )}
          {templateSources.map((source) => (
            <div
              key={`${source.stream.handle}:${source.channel.handle}`}
              style={styles.protocolItem}
            >
              <div style={styles.protocolHeader}>
                <strong>
                  {source.stream.handle === source.channel.handle
                    ? objectName(source.stream)
                    : `${objectName(source.stream)} / ${objectName(source.channel)}`}
                </strong>
                <span style={styles.mutedText}>
                  {source.details.protocols
                    .map((protocol) => protocol.type || protocol.name)
                    .join(' -> ') || 'No protocols'}
                </span>
              </div>
              {source.details.error && (
                <div style={styles.errorText}>{source.details.error}</div>
              )}
              {!source.details.error && (
                <div style={styles.protocolBody}>
                  {source.details.protocols.map((protocol) => (
                    <div key={protocol.name} style={styles.protocolRow}>
                      <span style={styles.protocolName}>{protocol.name}</span>
                      <span style={styles.protocolFields}>
                        {protocol.fields
                          .filter(
                            (field) => field.value || field.attributes.binding
                          )
                          .slice(0, 8)
                          .map(
                            (field) =>
                              `${field.path}=${field.value || field.attributes.binding || ''}`
                          )
                          .join(', ')}
                      </span>
                    </div>
                  ))}
                  {source.details.modifiers.slice(0, 6).map((modifier) => (
                    <div key={modifier.name} style={styles.protocolRow}>
                      <span style={styles.protocolName}>
                        modifier {modifier.name}
                      </span>
                      <span style={styles.protocolFields}>
                        {formatModifier(modifier)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const VpnTab: React.FC<{ model: XcfgModel; styles: ViewerStyles }> = ({
  model,
  styles
}) => {
  const vrfs = objectsByClass(model, 'BgpIpVpnVrfConfig')

  return (
    <section style={styles.section}>
      <SectionTitle title="VPN And VRF" styles={styles} />
      <DataTable
        styles={styles}
        rows={vrfs.map((vrf) => {
          const props = mergedProps(vrf)
          return [
            formatValue(props.VrfName || objectName(vrf)),
            vrf.handle,
            displayName(
              model,
              typeof props.PortHandle === 'string'
                ? props.PortHandle
                : undefined
            ),
            displayName(
              model,
              typeof props.InterfaceHandle === 'string'
                ? props.InterfaceHandle
                : undefined
            ),
            formatValue(props.PortSide),
            formatValue(props.Protocol),
            formatValue(props.Network),
            formatValue(props.RouteDistinguisher)
          ]
        })}
        columns={[
          'VRF',
          'Handle',
          'Port',
          'Interface',
          'Side',
          'Protocol',
          'Network',
          'RD'
        ]}
      />
    </section>
  )
}

const DiagnosticsTab: React.FC<{
  parsed: ParsedXcfg
  styles: ViewerStyles
}> = ({ parsed, styles }) => {
  const failedBlocks = parsed.blocks.filter((block) => block.error)
  const warnings = parsed.model.warnings

  return (
    <div style={styles.stack}>
      <section style={styles.section}>
        <SectionTitle title="Warnings" styles={styles} />
        {warnings.length === 0 ? (
          <div style={styles.emptyState}>No parser warnings.</div>
        ) : (
          <ul style={styles.warningList}>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        )}
      </section>
      <section style={styles.section}>
        <SectionTitle title="Blocks" styles={styles} />
        <DataTable
          styles={styles}
          rows={parsed.blocks
            .slice(0, 300)
            .map((block) => [
              String(block.index),
              block.kind,
              String(block.rawSize),
              String(block.decompressedSize),
              block.error || 'ok'
            ])}
          columns={['Index', 'Kind', 'Raw Bytes', 'Decoded Bytes', 'Status']}
          numericColumns={[0, 2, 3]}
        />
        {parsed.blocks.length > 300 && (
          <div style={styles.mutedText}>
            Showing first 300 of {parsed.blocks.length} blocks.
          </div>
        )}
        {failedBlocks.length > 0 && (
          <div style={styles.errorText}>
            {failedBlocks.length} blocks failed to decompress.
          </div>
        )}
      </section>
    </div>
  )
}

const ObjectsTab: React.FC<{
  model: XcfgModel
  objects: XcfgObject[]
  query: string
  selectedObject?: XcfgObject
  onQueryChange: (value: string) => void
  onSelect: (handle: string) => void
  styles: ViewerStyles
}> = ({
  model,
  objects,
  query,
  selectedObject,
  onQueryChange,
  onSelect,
  styles
}) => {
  return (
    <div style={styles.stack}>
      <section style={styles.section}>
        <div style={styles.objectToolbar}>
          <SectionTitle title="Objects" styles={styles} />
          <input
            value={query}
            onChange={(event: { target: { value: string } }) =>
              onQueryChange(event.target.value)
            }
            placeholder="Search objects"
            style={styles.searchInput}
          />
        </div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Class', 'Name', 'Handle', 'Parent', 'Source'].map(
                  (header) => (
                    <th key={header} style={styles.th}>
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {objects.map((obj) => (
                <tr
                  key={obj.handle}
                  onClick={() => onSelect(obj.handle)}
                  style={
                    selectedObject?.handle === obj.handle
                      ? styles.selectedRow
                      : styles.clickableRow
                  }
                >
                  <td style={styles.td}>{obj.className}</td>
                  <td style={styles.td}>{objectName(obj)}</td>
                  <td style={styles.tdMono}>{obj.handle}</td>
                  <td style={styles.td}>{displayName(model, obj.upper)}</td>
                  <td style={styles.td}>
                    {obj.sourceBlock !== undefined
                      ? `block ${obj.sourceBlock}`
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedObject && (
        <section style={styles.section}>
          <SectionTitle
            title={`${selectedObject.className}: ${objectName(selectedObject)}`}
            styles={styles}
          />
          <ObjectDetails obj={selectedObject} model={model} styles={styles} />
        </section>
      )}
    </div>
  )
}

const ObjectDetails: React.FC<{
  obj: XcfgObject
  model: XcfgModel
  styles: ViewerStyles
}> = ({ obj, model, styles }) => {
  const props = mergedProps(obj)
  const rows: string[][] = [
    ['Handle', obj.handle],
    ['Class', obj.className],
    ['Parent', displayName(model, obj.upper)],
    ['Children', String(obj.children.length)],
    ['Source', obj.sourceBlock !== undefined ? `block ${obj.sourceBlock}` : '']
  ]

  Object.entries(props)
    .filter(
      ([key, value]) =>
        key !== 'TemplateString' &&
        value !== null &&
        value !== '' &&
        (!Array.isArray(value) || value.length > 0)
    )
    .slice(0, 80)
    .forEach(([key, value]) => rows.push([key, formatValue(value, 240)]))

  return (
    <DataTable styles={styles} rows={rows} columns={['Property', 'Value']} />
  )
}

const Metric: React.FC<{
  label: string
  value: string | number
  subValue?: string
  styles: ViewerStyles
}> = ({ label, value, subValue, styles }) => (
  <div style={styles.metricTile}>
    <div style={styles.metricLabel}>{label}</div>
    <div style={styles.metricValue}>{value}</div>
    {subValue && <div style={styles.metricSubValue}>{subValue}</div>}
  </div>
)

const SectionTitle: React.FC<{ title: string; styles: ViewerStyles }> = ({
  title,
  styles
}) => <h3 style={styles.sectionTitle}>{title}</h3>

const StatusPill: React.FC<{
  status: 'idle' | 'loading' | 'ready' | 'error'
  palette: ViewerPalette
}> = ({ status, palette }) => {
  const color =
    status === 'ready'
      ? palette.success
      : status === 'error'
        ? palette.danger
        : palette.warning
  const label =
    status === 'ready'
      ? 'Ready'
      : status === 'loading'
        ? 'Parsing'
        : status === 'error'
          ? 'Error'
          : 'Idle'
  return (
    <span
      style={{
        border: `1px solid ${color}`,
        color,
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </span>
  )
}

const DataTable: React.FC<{
  rows: string[][]
  columns: string[]
  numericColumns?: number[]
  styles: ViewerStyles
}> = ({ rows, columns, numericColumns = [], styles }) => {
  if (rows.length === 0) {
    return <div style={styles.emptyState}>No records.</div>
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                style={
                  numericColumns.includes(index) ? styles.thNumber : styles.th
                }
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={
                    numericColumns.includes(cellIndex)
                      ? styles.tdNumber
                      : styles.td
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

async function parseXcfgBlob(blob: Blob): Promise<ParsedXcfg> {
  const data = new Uint8Array(await blob.arrayBuffer())
  const segments = iterSegments(data, separatorBytes)
  const blocks: XcfgBlock[] = []

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    try {
      const payload = await inflateBlock(segment.bytes)
      blocks.push({
        index,
        startOffset: segment.start,
        endOffset: segment.end,
        rawSize: segment.bytes.length,
        decompressedSize: payload.length,
        kind: classifyPayload(payload),
        payload
      })
    } catch (error) {
      blocks.push({
        index,
        startOffset: segment.start,
        endOffset: segment.end,
        rawSize: segment.bytes.length,
        decompressedSize: 0,
        kind: 'zlib-error',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return {
    blocks,
    model: parseXcfgBlocks(blocks),
    fileSize: data.length
  }
}

function iterSegments(
  data: Uint8Array,
  separator: Uint8Array
): Array<{ start: number; end: number; bytes: Uint8Array }> {
  const segments: Array<{ start: number; end: number; bytes: Uint8Array }> = []
  let cursor = 0

  while (cursor <= data.length) {
    const markerAt = indexOfBytes(data, separator, cursor)
    if (markerAt === -1) {
      if (cursor < data.length) {
        segments.push({
          start: cursor,
          end: data.length,
          bytes: data.slice(cursor)
        })
      }
      break
    }

    if (markerAt > cursor) {
      const blockEnd = data[markerAt - 1] === 10 ? markerAt - 1 : markerAt
      segments.push({
        start: cursor,
        end: markerAt,
        bytes: data.slice(cursor, blockEnd)
      })
    }
    cursor = markerAt + separator.length
  }

  return segments
}

function indexOfBytes(
  data: Uint8Array,
  needle: Uint8Array,
  start: number
): number {
  if (needle.length === 0) {
    return start
  }

  for (let index = start; index <= data.length - needle.length; index += 1) {
    let matches = true
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (data[index + offset] !== needle[offset]) {
        matches = false
        break
      }
    }
    if (matches) {
      return index
    }
  }
  return -1
}

async function inflateBlock(data: Uint8Array): Promise<Uint8Array> {
  const ctor = (
    globalThis as unknown as {
      DecompressionStream?: new (
        format: string
      ) => TransformStream<Uint8Array, Uint8Array>
    }
  ).DecompressionStream

  if (ctor) {
    try {
      return await inflateWithDecompressionStream(data, ctor)
    } catch (nativeError) {
      try {
        return unzlibSync(data)
      } catch (fallbackError) {
        throw new Error(
          `DecompressionStream failed: ${formatError(nativeError)}; fflate failed: ${formatError(fallbackError)}`
        )
      }
    }
  }

  try {
    return unzlibSync(data)
  } catch (error) {
    throw new Error(
      `fflate failed: ${formatError(error)}; DecompressionStream is unavailable`
    )
  }
}

async function inflateWithDecompressionStream(
  data: Uint8Array,
  ctor: new (format: string) => TransformStream<Uint8Array, Uint8Array>
): Promise<Uint8Array> {
  const blockBuffer = new ArrayBuffer(data.byteLength)
  new Uint8Array(blockBuffer).set(data)
  const stream = new Blob([blockBuffer])
    .stream()
    .pipeThrough(new ctor('deflate'))
  const buffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(buffer)
}

function formatError(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error)
}

function classifyPayload(payload: Uint8Array): string {
  const first = firstNonWhitespace(payload)
  if (first === undefined) {
    return 'empty'
  }
  if (first === 60) {
    return 'xml'
  }
  if (first === 123 || first === 91) {
    return 'json-like'
  }
  if (payload[0] === 90 || includesAscii(payload, 'Parent_Child_Relation')) {
    return 'xcfg-protobuf'
  }
  if (safeText(payload)) {
    return 'text'
  }
  return 'binary'
}

function parseXcfgBlocks(blocks: XcfgBlock[]): XcfgModel {
  const model: XcfgModel = { source: 'xcfg', objects: new Map(), warnings: [] }

  for (const block of blocks) {
    if (!block.payload || block.error) {
      if (block.error) {
        model.warnings.push(
          `Block ${block.index} failed to decode: ${block.error}`
        )
      }
      continue
    }

    try {
      for (const obj of parsePayloadObjects(block.payload, block.index)) {
        addObject(model, obj)
      }
    } catch (error) {
      if (block.kind === 'xcfg-protobuf') {
        model.warnings.push(
          `Block ${block.index} wire parse failed: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  }

  buildLinks(model)
  return model
}

function parsePayloadObjects(
  payload: Uint8Array,
  blockIndex?: number
): XcfgObject[] {
  const objects: XcfgObject[] = []
  const fields = parseFields(payload)

  for (const field of fields) {
    if (
      field.number === 11 &&
      field.wireType === 2 &&
      field.value instanceof Uint8Array
    ) {
      const obj = parseObjectMessage(field.value, blockIndex)
      if (obj) {
        objects.push(obj)
      }
    }
  }

  const direct = parseObjectMessage(payload, blockIndex)
  if (direct && !objects.some((obj) => obj.handle === direct.handle)) {
    objects.push(direct)
  }
  return objects
}

function parseObjectMessage(
  data: Uint8Array,
  blockIndex?: number
): XcfgObject | null {
  let fields: WireField[]
  try {
    fields = parseFields(data)
  } catch {
    return null
  }

  const handle = firstStringField(fields, 1)
  const className = firstStringField(fields, 2)
  if (!isHandleLike(handle) || !isClassLike(className)) {
    return null
  }

  const props: Record<string, ScalarValue> = {}
  const parentHandles: string[] = []
  const relations: Record<string, string[]> = {}

  for (const field of fields) {
    if (field.wireType !== 2 || !(field.value instanceof Uint8Array)) {
      continue
    }
    if (field.number === 3) {
      const parsed = parseProperty(field.value)
      if (parsed) {
        props[parsed.key] = parsed.value
      }
    } else if (field.number === 4 || field.number === 5 || field.number === 6) {
      const relation = parseRelation(field.value)
      if (!relation) {
        continue
      }
      const direction = field.number === 4 ? 'children' : 'parents'
      const relationKey = `${direction}:${relation.name}`
      relations[relationKey] = relations[relationKey] || []
      for (const target of relation.targets) {
        if (!relations[relationKey].includes(target)) {
          relations[relationKey].push(target)
        }
      }
      if (field.number === 5 && relation.name === 'Parent_Child_Relation') {
        parentHandles.push(...relation.targets)
      }
    }
  }

  return {
    handle,
    className,
    upper: parentHandles[0],
    props,
    updates: [],
    children: [],
    relations,
    sourceBlock: blockIndex
  }
}

function parseProperty(
  data: Uint8Array
): { key: string; value: ScalarValue } | null {
  let fields: WireField[]
  try {
    fields = parseFields(data)
  } catch {
    return null
  }

  const key = firstStringField(fields, 1)
  if (!key) {
    return null
  }

  const values = fields
    .filter((field) => field.number === 2)
    .map((field) => decodeFieldValue(field))
    .filter((value): value is ScalarValue => value !== undefined)

  if (values.length === 0) {
    return { key, value: null }
  }
  if (values.length === 1) {
    return { key, value: values[0] }
  }
  return { key, value: values }
}

function parseRelation(
  data: Uint8Array
): { name: string; targets: string[] } | null {
  let fields: WireField[]
  try {
    fields = parseFields(data)
  } catch {
    return null
  }

  const name = firstStringField(fields, 1)
  if (!name) {
    return null
  }

  const targets: string[] = []
  for (const field of fields) {
    if (
      field.number === 1 ||
      field.wireType !== 2 ||
      !(field.value instanceof Uint8Array)
    ) {
      continue
    }
    for (const target of decodeStringList(field.value)) {
      if (target && !targets.includes(target)) {
        targets.push(target)
      }
    }
  }
  return { name, targets }
}

function decodeStringList(data: Uint8Array): string[] {
  let fields: WireField[]
  try {
    fields = parseFields(data)
  } catch {
    const text = safeText(data)
    return text ? [text] : []
  }

  const values: string[] = []
  for (const field of fields) {
    if (field.wireType === 2 && field.value instanceof Uint8Array) {
      const nested = decodeStringList(field.value)
      if (nested.length > 0) {
        values.push(...nested)
      } else {
        const text = safeText(field.value)
        if (text) {
          values.push(text)
        }
      }
    } else if (field.wireType === 0 && typeof field.value === 'number') {
      values.push(String(field.value))
    }
  }
  return values
}

function decodeFieldValue(
  field: WireField,
  depth = 0
): ScalarValue | undefined {
  if (field.wireType === 0 && typeof field.value === 'number') {
    return field.number === 5 ? Boolean(field.value) : field.value
  }
  if (field.wireType === 1 && field.value instanceof Uint8Array) {
    return new DataView(
      field.value.buffer,
      field.value.byteOffset,
      field.value.byteLength
    ).getFloat64(0, true)
  }
  if (field.wireType === 5 && field.value instanceof Uint8Array) {
    return new DataView(
      field.value.buffer,
      field.value.byteOffset,
      field.value.byteLength
    ).getFloat32(0, true)
  }
  if (field.wireType !== 2 || !(field.value instanceof Uint8Array)) {
    return undefined
  }
  if (field.number === 7 && field.value.length === 0) {
    return ''
  }
  const value = decodeScalar(field.value, depth + 1)
  if (value === null && field.number === 7) {
    return safeText(field.value)
  }
  return value
}

function decodeScalar(data: Uint8Array, depth = 0): ScalarValue {
  if (data.length === 0) {
    return null
  }
  if (depth > 8) {
    return safeText(data) || bytesToHex(data)
  }

  let fields: WireField[]
  try {
    fields = parseFields(data)
  } catch {
    return safeText(data) || bytesToHex(data)
  }

  if (fields.length === 0) {
    return null
  }
  if (fields.length === 1) {
    const value = decodeFieldValue(fields[0], depth + 1)
    if (value !== undefined) {
      return value
    }
  }

  const values = fields
    .map((field) => decodeFieldValue(field, depth + 1))
    .filter((value): value is ScalarValue => value !== undefined)

  if (values.length === 1) {
    return values[0]
  }
  if (
    values.every((value) =>
      ['string', 'number', 'boolean'].includes(typeof value)
    )
  ) {
    const deduped: ScalarValue[] = []
    for (const value of values) {
      if (!deduped.some((item) => Object.is(item, value))) {
        deduped.push(value)
      }
    }
    return deduped.length === 1 ? deduped[0] : deduped
  }

  return Object.fromEntries(
    fields.map((field) => [
      `field_${field.number}`,
      decodeFieldValue(field, depth + 1) ?? null
    ])
  )
}

function parseFields(data: Uint8Array): WireField[] {
  const fields: WireField[] = []
  let offset = 0

  while (offset < data.length) {
    const tagResult = readVarint(data, offset)
    const tag = tagResult.value
    offset = tagResult.offset
    if (tag === 0) {
      throw new Error('zero wire tag')
    }
    const number = Math.floor(tag / 8)
    const wireType = tag & 7
    if (number <= 0) {
      throw new Error('invalid field number')
    }

    if (wireType === 0) {
      const valueResult = readVarint(data, offset)
      fields.push({ number, wireType, value: valueResult.value })
      offset = valueResult.offset
    } else if (wireType === 1) {
      ensureAvailable(data, offset, 8)
      fields.push({ number, wireType, value: data.slice(offset, offset + 8) })
      offset += 8
    } else if (wireType === 2) {
      const lengthResult = readVarint(data, offset)
      const length = lengthResult.value
      offset = lengthResult.offset
      ensureAvailable(data, offset, length)
      fields.push({
        number,
        wireType,
        value: data.slice(offset, offset + length)
      })
      offset += length
    } else if (wireType === 5) {
      ensureAvailable(data, offset, 4)
      fields.push({ number, wireType, value: data.slice(offset, offset + 4) })
      offset += 4
    } else {
      throw new Error(`unsupported wire type ${wireType}`)
    }
  }

  return fields
}

function readVarint(
  data: Uint8Array,
  offset: number
): { value: number; offset: number } {
  let result = 0
  let shift = 0

  while (offset < data.length) {
    const byte = data[offset]
    offset += 1
    result += (byte & 0x7f) * 2 ** shift
    if ((byte & 0x80) === 0) {
      return { value: result, offset }
    }
    shift += 7
    if (shift >= 64) {
      throw new Error('varint is too long')
    }
  }

  throw new Error('truncated varint')
}

function ensureAvailable(data: Uint8Array, offset: number, size: number): void {
  if (size < 0 || offset + size > data.length) {
    throw new Error('truncated field')
  }
}

function firstStringField(fields: WireField[], number: number): string {
  for (const field of fields) {
    if (
      field.number === number &&
      field.wireType === 2 &&
      field.value instanceof Uint8Array
    ) {
      const text = safeText(field.value)
      if (text) {
        return text
      }
    }
  }
  return ''
}

function safeText(data: Uint8Array): string {
  if (data.length === 0) {
    return ''
  }
  let text = ''
  try {
    text = textDecoder.decode(data)
  } catch {
    return ''
  }
  if (!text) {
    return ''
  }
  const printable = Array.from(text).filter(
    (char) => char === '\n' || char === '\r' || char === '\t' || char >= ' '
  ).length
  if (printable / text.length < 0.85) {
    return ''
  }
  return text.trim()
}

function isHandleLike(value: string): boolean {
  return (
    Boolean(value) &&
    !value.includes(' ') &&
    (value.includes('_') || value === 'SysEntry_1')
  )
}

function isClassLike(value: string): boolean {
  return Boolean(value) && /^[A-Za-z0-9_]+$/.test(value)
}

function addObject(model: XcfgModel, obj: XcfgObject): void {
  const existing = model.objects.get(obj.handle)
  if (!existing) {
    model.objects.set(obj.handle, obj)
    return
  }

  existing.props = { ...existing.props, ...obj.props }
  existing.updates = existing.updates.concat(obj.updates)
  existing.upper = existing.upper || obj.upper
  existing.sourceBlock = existing.sourceBlock ?? obj.sourceBlock
  for (const [name, targets] of Object.entries(obj.relations)) {
    existing.relations[name] = existing.relations[name] || []
    for (const target of targets) {
      if (!existing.relations[name].includes(target)) {
        existing.relations[name].push(target)
      }
    }
  }
}

function buildLinks(model: XcfgModel): void {
  for (const obj of model.objects.values()) {
    obj.children = []
  }

  for (const obj of model.objects.values()) {
    if (obj.upper && model.objects.has(obj.upper)) {
      const parent = model.objects.get(obj.upper)
      if (parent && !parent.children.includes(obj.handle)) {
        parent.children.push(obj.handle)
      }
    }
  }

  for (const obj of model.objects.values()) {
    const children = obj.relations['children:Parent_Child_Relation'] || []
    for (const childHandle of children) {
      const child = model.objects.get(childHandle)
      if (child && !child.upper) {
        child.upper = obj.handle
      }
      if (child && !obj.children.includes(childHandle)) {
        obj.children.push(childHandle)
      }
    }
  }
}

function parseTemplateString(
  template: ScalarValue | undefined
): TemplateDetails {
  if (typeof template !== 'string' || !template) {
    return { protocols: [], modifiers: [] }
  }
  if (typeof DOMParser === 'undefined') {
    return { protocols: [], modifiers: [], error: 'DOMParser is unavailable.' }
  }

  const doc = new DOMParser().parseFromString(template, 'application/xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    return {
      protocols: [],
      modifiers: [],
      error: parserError.textContent || 'XML parse error'
    }
  }

  const protocols = Array.from(doc.querySelectorAll('XetProtocol')).map(
    (node) => ({
      name: node.getAttribute('name') || '',
      type: node.getAttribute('type') || '',
      fields: Array.from(node.children).flatMap((child) =>
        collectProtocolFields(child, child.tagName)
      )
    })
  )

  const modifiers = Array.from(
    doc.querySelectorAll('XetModifiers > XetModifier')
  ).map((node) => {
    const values: Record<string, ScalarValue> = {}
    Array.from(node.children).forEach((child) => {
      if (child.tagName === 'List') {
        values[child.tagName] = Array.from(child.children).map((item) => ({
          value: (item.textContent || '').trim(),
          ...Object.fromEntries(
            Array.from(item.attributes).map((attr) => [attr.name, attr.value])
          )
        })) as ScalarValue
      } else {
        values[child.tagName] = (child.textContent || '').trim()
      }
    })
    return { name: node.getAttribute('name') || '', values }
  })

  return { protocols, modifiers }
}

function collectProtocolFields(node: Element, path: string): ProtocolField[] {
  const attributes = Object.fromEntries(
    Array.from(node.attributes).map((attr) => [attr.name, attr.value])
  )
  const text = (node.textContent || '').trim()
  const children = Array.from(node.children)

  if (children.length === 0) {
    return [{ path, value: text, attributes }]
  }

  const own =
    text || Object.keys(attributes).length > 0
      ? [{ path, value: '', attributes }]
      : []
  return own.concat(
    children.flatMap((child) =>
      collectProtocolFields(child, `${path}.${child.tagName}`)
    )
  )
}

function getTemplateSources(model: XcfgModel): Array<{
  stream: XcfgObject
  channel: XcfgObject
  details: TemplateDetails
}> {
  const streams = objectsByClass(model, 'StreamTemplate')
  const channelMap = new Map(
    objectsByClass(model, 'StreamChannel').map((channel) => [
      channel.handle,
      channel
    ])
  )
  const sources: Array<{
    stream: XcfgObject
    channel: XcfgObject
    details: TemplateDetails
  }> = []

  for (const stream of streams) {
    const streamTemplate = mergedProps(stream).TemplateString
    if (streamTemplate) {
      sources.push({
        stream,
        channel: stream,
        details: parseTemplateString(streamTemplate)
      })
    }
    for (const childHandle of stream.children) {
      const channel = channelMap.get(childHandle)
      if (!channel) {
        continue
      }
      const template = mergedProps(channel).TemplateString
      if (template) {
        sources.push({
          stream,
          channel,
          details: parseTemplateString(template)
        })
      }
    }
  }

  return sources
}

function objectsByClass(model: XcfgModel, className: string): XcfgObject[] {
  return objectsSorted(model).filter((obj) => obj.className === className)
}

function objectsSorted(model: XcfgModel): XcfgObject[] {
  return Array.from(model.objects.values()).sort((left, right) =>
    naturalCompare(left.handle, right.handle)
  )
}

function getClassCounts(model: XcfgModel): Array<[string, number]> {
  const counts = new Map<string, number>()
  for (const obj of model.objects.values()) {
    counts.set(obj.className, (counts.get(obj.className) || 0) + 1)
  }
  return Array.from(counts.entries()).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  )
}

function getBlockKindCounts(blocks: XcfgBlock[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const block of blocks) {
    counts.set(block.kind, (counts.get(block.kind) || 0) + 1)
  }
  return new Map(
    Array.from(counts.entries()).sort((left, right) =>
      left[0].localeCompare(right[0])
    )
  )
}

function getMetrics(
  model: XcfgModel,
  blocks: XcfgBlock[],
  fileSize: number
): Record<string, number> {
  return {
    objects: model.objects.size,
    blocks: blocks.length,
    failedBlocks: blocks.filter((block) => block.error).length,
    ports: objectsByClass(model, 'Port').length,
    streams: objectsByClass(model, 'StreamTemplate').length,
    vrfs: objectsByClass(model, 'BgpIpVpnVrfConfig').length,
    fileSize
  }
}

function mergedProps(obj: XcfgObject): Record<string, ScalarValue> {
  return obj.updates.reduce((props, update) => ({ ...props, ...update }), {
    ...obj.props
  })
}

function objectName(obj: XcfgObject): string {
  const name = mergedProps(obj).Name
  return typeof name === 'string' && name ? name : obj.handle
}

function displayName(model: XcfgModel, handle?: string): string {
  if (!handle) {
    return ''
  }
  const obj = model.objects.get(handle)
  if (!obj) {
    return handle
  }
  const name = objectName(obj)
  return name === handle ? handle : `${name} (${handle})`
}

function formatModifier(modifier: ModifierInfo): string {
  const keys = ['Type', 'Direction', 'Count', 'Repeat', 'Start', 'Step', 'List']
  return keys
    .filter((key) => modifier.values[key] !== undefined)
    .map((key) => `${key}=${formatValue(modifier.values[key])}`)
    .join(', ')
}

function formatValue(value: ScalarValue | undefined, limit = 120): string {
  if (value === undefined || value === null) {
    return ''
  }
  let text = ''
  if (typeof value === 'boolean') {
    text = value ? 'true' : 'false'
  } else if (Array.isArray(value)) {
    text = value.map((item) => formatValue(item, limit)).join(', ')
  } else if (typeof value === 'object') {
    text = Object.entries(value)
      .map(([key, item]) => `${key}=${formatValue(item, limit)}`)
      .join(', ')
  } else {
    text = String(value)
  }

  text = text.replace(/\s+/g, ' ').trim()
  return text.length > limit
    ? `${text.slice(0, Math.max(0, limit - 3))}...`
    : text
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function naturalCompare(left: string, right: string): number {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: 'base'
  })
}

function firstNonWhitespace(data: Uint8Array): number | undefined {
  for (const byte of data) {
    if (![9, 10, 13, 32].includes(byte)) {
      return byte
    }
  }
  return undefined
}

function includesAscii(data: Uint8Array, needle: string): boolean {
  return indexOfBytes(data, textEncoder.encode(needle), 0) !== -1
}

function bytesToHex(data: Uint8Array): string {
  return Array.from(data.slice(0, 64))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

interface ViewerPalette {
  background: string
  surface: string
  surfaceAlt: string
  border: string
  text: string
  muted: string
  accent: string
  accentSoft: string
  success: string
  warning: string
  danger: string
  tableStripe: string
  selected: string
  monoBg: string
}

interface ViewerStyles {
  root: React.CSSProperties
  header: React.CSSProperties
  kicker: React.CSSProperties
  title: React.CSSProperties
  emptyState: React.CSSProperties
  errorBox: React.CSSProperties
  errorText: React.CSSProperties
  mutedText: React.CSSProperties
  metricsGrid: React.CSSProperties
  metricTile: React.CSSProperties
  metricLabel: React.CSSProperties
  metricValue: React.CSSProperties
  metricSubValue: React.CSSProperties
  tabList: React.CSSProperties
  tab: React.CSSProperties
  activeTab: React.CSSProperties
  contentPanel: React.CSSProperties
  stack: React.CSSProperties
  section: React.CSSProperties
  twoColumnSection: React.CSSProperties
  sectionTitle: React.CSSProperties
  tableWrap: React.CSSProperties
  table: React.CSSProperties
  th: React.CSSProperties
  thNumber: React.CSSProperties
  td: React.CSSProperties
  tdNumber: React.CSSProperties
  tdMono: React.CSSProperties
  clickableRow: React.CSSProperties
  selectedRow: React.CSSProperties
  protocolList: React.CSSProperties
  protocolItem: React.CSSProperties
  protocolHeader: React.CSSProperties
  protocolBody: React.CSSProperties
  protocolRow: React.CSSProperties
  protocolName: React.CSSProperties
  protocolFields: React.CSSProperties
  warningList: React.CSSProperties
  objectToolbar: React.CSSProperties
  searchInput: React.CSSProperties
}

function makePalette(isDarkMode: boolean): ViewerPalette {
  return isDarkMode
    ? {
        background: '#101418',
        surface: '#151b21',
        surfaceAlt: '#1b232b',
        border: '#2b3844',
        text: '#e7edf2',
        muted: '#a9b5bf',
        accent: '#6bb7d6',
        accentSoft: '#1e3b48',
        success: '#7acb8e',
        warning: '#d8b65a',
        danger: '#e57979',
        tableStripe: '#12181e',
        selected: '#243743',
        monoBg: '#0d1116'
      }
    : {
        background: '#f7f8fa',
        surface: '#ffffff',
        surfaceAlt: '#eef3f6',
        border: '#d8e0e7',
        text: '#17212b',
        muted: '#607080',
        accent: '#21759b',
        accentSoft: '#dbeef6',
        success: '#247a43',
        warning: '#8a641d',
        danger: '#b23636',
        tableStripe: '#f3f6f8',
        selected: '#e6f2f7',
        monoBg: '#edf1f4'
      }
}

function makeStyles(palette: ViewerPalette): ViewerStyles {
  const tableCellBase: React.CSSProperties = {
    borderBottom: `1px solid ${palette.border}`,
    padding: '9px 10px',
    verticalAlign: 'top',
    fontSize: 13,
    lineHeight: 1.35,
    color: palette.text,
    maxWidth: 360,
    overflowWrap: 'anywhere'
  }

  return {
    root: {
      background: palette.background,
      color: palette.text,
      border: `1px solid ${palette.border}`,
      borderRadius: 8,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: 16,
      minHeight: 360,
      boxSizing: 'border-box'
    },
    header: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      borderBottom: `1px solid ${palette.border}`,
      paddingBottom: 12,
      marginBottom: 14
    },
    kicker: {
      color: palette.muted,
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0
    },
    title: {
      margin: '2px 0 0',
      fontSize: 20,
      lineHeight: 1.2,
      fontWeight: 750,
      letterSpacing: 0,
      color: palette.text,
      overflowWrap: 'anywhere'
    },
    emptyState: {
      border: `1px solid ${palette.border}`,
      background: palette.surface,
      color: palette.muted,
      borderRadius: 8,
      padding: 16,
      fontSize: 14
    },
    errorBox: {
      border: `1px solid ${palette.danger}`,
      background: palette.surface,
      color: palette.danger,
      borderRadius: 8,
      padding: 16,
      fontSize: 14,
      overflowWrap: 'anywhere'
    },
    errorText: {
      color: palette.danger,
      fontSize: 13,
      lineHeight: 1.4,
      overflowWrap: 'anywhere'
    },
    mutedText: {
      color: palette.muted,
      fontSize: 13,
      lineHeight: 1.4,
      overflowWrap: 'anywhere'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: 10,
      marginBottom: 14
    },
    metricTile: {
      border: `1px solid ${palette.border}`,
      background: palette.surface,
      borderRadius: 8,
      padding: '10px 12px',
      minHeight: 72,
      boxSizing: 'border-box'
    },
    metricLabel: {
      color: palette.muted,
      fontSize: 12,
      fontWeight: 650,
      lineHeight: 1.2
    },
    metricValue: {
      color: palette.text,
      fontSize: 22,
      fontWeight: 760,
      lineHeight: 1.2,
      marginTop: 6
    },
    metricSubValue: {
      color: palette.muted,
      fontSize: 12,
      marginTop: 2
    },
    tabList: {
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      borderBottom: `1px solid ${palette.border}`,
      marginBottom: 14,
      paddingBottom: 8
    },
    tab: {
      border: `1px solid ${palette.border}`,
      background: palette.surface,
      color: palette.text,
      borderRadius: 8,
      padding: '8px 10px',
      fontSize: 13,
      fontWeight: 650,
      whiteSpace: 'nowrap',
      cursor: 'pointer'
    },
    activeTab: {
      border: `1px solid ${palette.accent}`,
      background: palette.accentSoft,
      color: palette.text,
      borderRadius: 8,
      padding: '8px 10px',
      fontSize: 13,
      fontWeight: 750,
      whiteSpace: 'nowrap',
      cursor: 'pointer'
    },
    contentPanel: {
      minHeight: 260
    },
    stack: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    },
    section: {
      border: `1px solid ${palette.border}`,
      background: palette.surface,
      borderRadius: 8,
      padding: 12,
      overflow: 'hidden'
    },
    twoColumnSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 14
    },
    sectionTitle: {
      margin: '0 0 10px',
      fontSize: 15,
      lineHeight: 1.25,
      fontWeight: 760,
      letterSpacing: 0,
      color: palette.text
    },
    tableWrap: {
      overflowX: 'auto',
      width: '100%'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'auto'
    },
    th: {
      ...tableCellBase,
      color: palette.muted,
      background: palette.surfaceAlt,
      fontWeight: 750,
      textAlign: 'left',
      whiteSpace: 'nowrap'
    },
    thNumber: {
      ...tableCellBase,
      color: palette.muted,
      background: palette.surfaceAlt,
      fontWeight: 750,
      textAlign: 'right',
      whiteSpace: 'nowrap'
    },
    td: tableCellBase,
    tdNumber: {
      ...tableCellBase,
      textAlign: 'right',
      whiteSpace: 'nowrap'
    },
    tdMono: {
      ...tableCellBase,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      background: palette.monoBg,
      whiteSpace: 'nowrap'
    },
    clickableRow: {
      cursor: 'pointer'
    },
    selectedRow: {
      cursor: 'pointer',
      background: palette.selected
    },
    protocolList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    },
    protocolItem: {
      border: `1px solid ${palette.border}`,
      borderRadius: 8,
      padding: 10,
      background: palette.tableStripe
    },
    protocolHeader: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      marginBottom: 8
    },
    protocolBody: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5
    },
    protocolRow: {
      display: 'grid',
      gridTemplateColumns: 'minmax(130px, 220px) minmax(180px, 1fr)',
      gap: 8,
      alignItems: 'baseline'
    },
    protocolName: {
      color: palette.accent,
      fontSize: 13,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      overflowWrap: 'anywhere'
    },
    protocolFields: {
      color: palette.text,
      fontSize: 13,
      lineHeight: 1.4,
      overflowWrap: 'anywhere'
    },
    warningList: {
      margin: 0,
      paddingLeft: 18,
      color: palette.text,
      fontSize: 13,
      lineHeight: 1.45
    },
    objectToolbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
      flexWrap: 'wrap'
    },
    searchInput: {
      border: `1px solid ${palette.border}`,
      background: palette.surfaceAlt,
      color: palette.text,
      borderRadius: 8,
      padding: '8px 10px',
      minWidth: 220,
      fontSize: 13,
      outline: 'none'
    }
  }
}
