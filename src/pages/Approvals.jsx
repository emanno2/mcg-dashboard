import { useState } from 'react'
import {
  Check, X, Edit3, Phone, MapPin, Clock, Image,
  MessageSquare, ChevronDown, ChevronUp, AlertCircle,
  DollarSign, Zap, RotateCcw, ZoomIn
} from 'lucide-react'
import { APPROVAL_QUEUE, ACTIONED_TODAY } from '../data/mockData'
import { Avatar, Badge } from '../components/ui'
import styles from './Approvals.module.css'
import clsx from 'clsx'

const REJECT_REASONS = [
  'Outside service area',
  'Service not offered',
  'Customer unresponsive',
  'Job too small',
  'Job too large / complex',
  'Scheduling not available',
  'Other',
]

// ─── TIME HELPERS ─────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtRange(low, high) {
  if (!low && !high) return 'TBD'
  return `$${low.toLocaleString()} – $${high.toLocaleString()}`
}

// ─── PHOTO LIGHTBOX ───────────────────────────────────────────────────────────
function PhotoLightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const photo = photos[idx]
  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
        <button className={styles.lightboxClose} onClick={onClose}><X size={16} /></button>
        <div className={styles.lightboxImage} style={{ background: photo.bg }} />
        <div className={styles.lightboxFooter}>
          <span className={styles.lightboxLabel}>{photo.label}</span>
          <div className={styles.lightboxDots}>
            {photos.map((_, i) => (
              <button
                key={i}
                className={clsx(styles.lightboxDot, i === idx && styles.lightboxDotActive)}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
          <span className={styles.lightboxCounter}>{idx + 1} / {photos.length}</span>
        </div>
        {photos.length > 1 && (
          <>
            <button className={clsx(styles.lightboxNav, styles.lightboxNavL)} onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}>‹</button>
            <button className={clsx(styles.lightboxNav, styles.lightboxNavR)} onClick={() => setIdx(i => (i + 1) % photos.length)}>›</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── REJECT MODAL ─────────────────────────────────────────────────────────────
function RejectModal({ item, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  const [custom, setCustom] = useState('')
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.rejectModal} onClick={e => e.stopPropagation()}>
        <div className={styles.rejectHeader}>
          <div className={styles.rejectTitle}><X size={16} /> Reject Quote Request</div>
          <button className={styles.modalXBtn} onClick={onCancel}><X size={14} /></button>
        </div>
        <div className={styles.rejectBody}>
          <div className={styles.rejectName}>{item.name} — {item.service}</div>
          <div className={styles.rejectReasonLabel}>Reason for rejection</div>
          <div className={styles.rejectReasons}>
            {REJECT_REASONS.map(r => (
              <button
                key={r}
                className={clsx(styles.rejectReasonBtn, reason === r && styles.rejectReasonBtnOn)}
                onClick={() => setReason(r)}
              >
                {reason === r && <Check size={11} strokeWidth={3} />}
                {r}
              </button>
            ))}
          </div>
          {reason === 'Other' && (
            <textarea
              className={styles.rejectNote}
              placeholder="Add a note..."
              value={custom}
              onChange={e => setCustom(e.target.value)}
              rows={2}
            />
          )}
          <div className={styles.rejectHint}>
            The AI will use this reason to improve future qualification for similar leads.
          </div>
        </div>
        <div className={styles.rejectFooter}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button
            className={styles.confirmRejectBtn}
            disabled={!reason}
            onClick={() => onConfirm(reason === 'Other' ? custom || reason : reason)}
          >
            <X size={13} /> Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SINGLE APPROVAL CARD ─────────────────────────────────────────────────────
function ApprovalCard({ item, onApprove, onReject, onRequestPhotos }) {
  const [expanded,    setExpanded]    = useState(false)
  const [editing,     setEditing]     = useState(false)
  const [lowVal,      setLowVal]      = useState(item.ownerEstimateLow)
  const [highVal,     setHighVal]     = useState(item.ownerEstimateHigh)
  const [lightbox,    setLightbox]    = useState(null)
  const [rejectModal, setRejectModal] = useState(false)

  const hasPhotos    = item.photos.length > 0
  const needsPhotos  = !hasPhotos
  const isHighValue  = item.aiEstimateHigh >= 5000
  const waitMinutes  = Math.floor((Date.now() - new Date(item.waitingSince).getTime()) / 60000)

  const priorityColor = {
    high:   'var(--danger-text)',
    medium: 'var(--warning-text)',
    low:    'var(--text-muted)',
  }[item.priority]

  return (
    <>
      <div className={clsx(styles.card, needsPhotos && styles.cardNeedsPhotos, isHighValue && styles.cardHighValue)}>

        {/* Priority stripe */}
        <div className={styles.priorityStripe} style={{ background: priorityColor }} />

        {/* Card header */}
        <div className={styles.cardHeader}>
          <div className={styles.cardLeft}>
            <Avatar initials={item.initials} color={item.avatarColor} size="lg" />
            <div className={styles.cardMeta}>
              <div className={styles.cardName}>{item.name}</div>
              <div className={styles.cardService}>{item.service}</div>
              <div className={styles.cardDetails}>
                <span><MapPin size={10} strokeWidth={2} />{item.address}</span>
                <span><Phone size={10} strokeWidth={2} />{item.phone}</span>
              </div>
            </div>
          </div>

          <div className={styles.cardRight}>
            {/* Waiting time */}
            <div className={clsx(styles.waitBadge, waitMinutes > 120 && styles.waitBadgeUrgent)}>
              <Clock size={11} strokeWidth={2} />
              {timeAgo(item.waitingSince)}
            </div>

            {/* Source */}
            <div className={styles.sourceBadge}>{item.source}</div>

            {/* High value flag */}
            {isHighValue && (
              <div className={styles.highValueBadge}>
                <DollarSign size={11} strokeWidth={2} />
                High value
              </div>
            )}

            {/* Expand */}
            <button className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Photos + estimate row — always visible */}
        <div className={styles.cardBody}>
          {/* Photos */}
          <div className={styles.photoSection}>
            {needsPhotos ? (
              <button className={styles.noPhotosBtn} onClick={() => onRequestPhotos(item)}>
                <Image size={14} strokeWidth={1.8} />
                <span>No photos yet</span>
                <span className={styles.requestLink}>Request via SMS →</span>
              </button>
            ) : (
              <div className={styles.photoRow}>
                {item.photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    className={styles.photoThumb}
                    style={{ background: photo.bg }}
                    onClick={() => setLightbox(i)}
                  >
                    <div className={styles.photoThumbOverlay}><ZoomIn size={14} /></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Estimate */}
          <div className={styles.estimateSection}>
            <div className={styles.estimateLabel}>
              <Zap size={12} strokeWidth={2} />
              AI Estimate
            </div>
            {editing ? (
              <div className={styles.estimateEdit}>
                <span>$</span>
                <input
                  type="number"
                  className={styles.estimateInput}
                  value={lowVal}
                  onChange={e => setLowVal(Number(e.target.value))}
                />
                <span>–</span>
                <span>$</span>
                <input
                  type="number"
                  className={styles.estimateInput}
                  value={highVal}
                  onChange={e => setHighVal(Number(e.target.value))}
                />
                <button className={styles.editDoneBtn} onClick={() => setEditing(false)}>
                  <Check size={13} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div className={styles.estimateValue}>
                {fmtRange(lowVal, highVal)}
                <button className={styles.editEstimateBtn} onClick={() => setEditing(true)}>
                  <Edit3 size={12} strokeWidth={2} />
                </button>
              </div>
            )}
            <div className={styles.estimateHint}>
              {needsPhotos ? 'Pending photos' : `AI range · ${item.photos.length} photo${item.photos.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className={styles.expandedSection}>
            <div className={styles.expandedGrid}>
              <div className={styles.expandedBlock}>
                <div className={styles.expandedBlockLabel}>AI Notes</div>
                <div className={styles.expandedBlockText}>{item.aiNotes}</div>
              </div>
              <div className={styles.expandedBlock}>
                <div className={styles.expandedBlockLabel}>
                  <MessageSquare size={11} strokeWidth={2} /> Customer's message
                </div>
                <div className={clsx(styles.expandedBlockText, styles.expandedQuote)}>
                  "{item.conversationSnippet}"
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.cardActions}>
          <button className={styles.actionReject} onClick={() => setRejectModal(true)}>
            <X size={14} strokeWidth={2.5} /> Reject
          </button>
          <button className={styles.actionSMS}>
            <MessageSquare size={14} strokeWidth={2} /> SMS Customer
          </button>
          <button
            className={clsx(styles.actionApprove, !hasPhotos && styles.actionApproveWarn)}
            onClick={() => onApprove(item, lowVal, highVal)}
          >
            <Check size={14} strokeWidth={2.5} />
            {editing ? 'Approve Edited Range' : 'Approve & Send'}
          </button>
        </div>

        {needsPhotos && (
          <div className={styles.photoWarning}>
            <AlertCircle size={12} strokeWidth={2} />
            Approving without photos — estimate range may be inaccurate
          </div>
        )}
      </div>

      {lightbox !== null && (
        <PhotoLightbox
          photos={item.photos}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      {rejectModal && (
        <RejectModal
          item={item}
          onConfirm={reason => { setRejectModal(false); onReject(item, reason) }}
          onCancel={() => setRejectModal(false)}
        />
      )}
    </>
  )
}

// ─── ACTIONED LOG ─────────────────────────────────────────────────────────────
function ActionedLog({ items, onUndo }) {
  return (
    <div className={styles.logSection}>
      <div className={styles.logTitle}>Actioned Today</div>
      <div className={styles.logList}>
        {items.map(item => (
          <div key={item.id} className={styles.logRow}>
            <div className={clsx(styles.logIcon, item.action === 'approved' ? styles.logIconApproved : styles.logIconRejected)}>
              {item.action === 'approved' ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
            </div>
            <Avatar initials={item.initials} color={item.avatarColor} size="sm" />
            <div className={styles.logInfo}>
              <span className={styles.logName}>{item.name}</span>
              <span className={styles.logService}>{item.service}</span>
              {item.actionNote && <span className={styles.logNote}>· {item.actionNote}</span>}
            </div>
            <div className={styles.logRight}>
              <span className={styles.logValue}>{item.estimateRange}</span>
              <span className={styles.logTime}>{formatTime(item.actionTime)}</span>
            </div>
            <button className={styles.undoBtn} onClick={() => onUndo(item)} title="Undo">
              <RotateCcw size={12} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const [queue,    setQueue]    = useState(APPROVAL_QUEUE)
  const [actioned, setActioned] = useState(ACTIONED_TODAY)

  function handleApprove(item, low, high) {
    setQueue(q => q.filter(i => i.id !== item.id))
    setActioned(a => [{
      id:          item.id,
      initials:    item.initials,
      name:        item.name,
      avatarColor: item.avatarColor,
      service:     item.service,
      estimateRange: fmtRange(low, high),
      action:      'approved',
      actionTime:  new Date().toISOString(),
      actionNote:  '',
    }, ...a])
  }

  function handleReject(item, reason) {
    setQueue(q => q.filter(i => i.id !== item.id))
    setActioned(a => [{
      id:          item.id,
      initials:    item.initials,
      name:        item.name,
      avatarColor: item.avatarColor,
      service:     item.service,
      estimateRange: fmtRange(item.ownerEstimateLow, item.ownerEstimateHigh),
      action:      'rejected',
      actionTime:  new Date().toISOString(),
      actionNote:  reason,
    }, ...a])
  }

  function handleUndo(item) {
    setActioned(a => a.filter(i => i.id !== item.id))
    const original = [...APPROVAL_QUEUE, ...ACTIONED_TODAY].find(i => i.id === item.id)
    if (original) setQueue(q => [original, ...q])
  }

  function handleRequestPhotos(item) {
    alert(`SMS sent to ${item.name} requesting photos for ${item.service}`)
  }

  const totalValue = queue.reduce((sum, i) => sum + (i.aiEstimateHigh || 0), 0)
  const oldest     = queue.length > 0
    ? Math.max(...queue.map(i => Date.now() - new Date(i.waitingSince).getTime()))
    : 0
  const oldestMins = Math.floor(oldest / 60000)

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Approvals</h1>
          <p className={styles.pageSubtitle}>Review AI-qualified quote requests before they go to customers</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue} style={{ color: queue.length > 0 ? 'var(--danger-text)' : 'var(--success-text)' }}>
            {queue.length}
          </div>
          <div className={styles.summaryLabel}>Pending</div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>${(totalValue / 1000).toFixed(1)}k</div>
          <div className={styles.summaryLabel}>Value waiting</div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue} style={{ color: oldestMins > 120 ? 'var(--warning-text)' : 'var(--text-primary)' }}>
            {queue.length > 0 ? (oldestMins < 60 ? `${oldestMins}m` : `${Math.floor(oldestMins/60)}h`) : '—'}
          </div>
          <div className={styles.summaryLabel}>Oldest request</div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue} style={{ color: 'var(--success-text)' }}>
            {actioned.filter(a => a.action === 'approved').length}
          </div>
          <div className={styles.summaryLabel}>Approved today</div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue} style={{ color: 'var(--danger-text)' }}>
            {actioned.filter(a => a.action === 'rejected').length}
          </div>
          <div className={styles.summaryLabel}>Rejected today</div>
        </div>
      </div>

      {/* Queue */}
      {queue.length === 0 ? (
        <div className={styles.emptyQueue}>
          <div className={styles.emptyIcon}><Check size={28} strokeWidth={1.5} /></div>
          <div className={styles.emptyTitle}>All caught up</div>
          <div className={styles.emptyDesc}>No pending approvals. New quote requests from the AI will appear here.</div>
        </div>
      ) : (
        <div className={styles.queue}>
          {queue.map(item => (
            <ApprovalCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestPhotos={handleRequestPhotos}
            />
          ))}
        </div>
      )}

      {/* Actioned log */}
      {actioned.length > 0 && (
        <ActionedLog items={actioned} onUndo={handleUndo} />
      )}
    </div>
  )
}
