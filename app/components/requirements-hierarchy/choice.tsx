import './styles.css'
// import styles from './styles.css'

/* eslint-disable */

interface ChoiceModalProps {
  isOpen: boolean
  title: string
  message: string
  onPathToRoot: () => void
  onSubtree: () => void
  onCancel: () => void
  nodeId: string
}

export default function ChoiceModal({
  isOpen,
  title,
  message,
  onPathToRoot,
  onSubtree,
  onCancel,
  nodeId
}: ChoiceModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="choice-modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="choice-modal-body">
          <p>{message}</p>
          <div className="choice-modal-footer">
            <button
              className="choice-modal-button path-to-root"
              onClick={onPathToRoot}
            >
              Путь до корня
            </button>
            <button className="choice-modal-button subtree" onClick={onSubtree}>
              Нижележащие требования
            </button>
            <button className="choice-modal-button cancel" onClick={onCancel}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* eslint-enable */
