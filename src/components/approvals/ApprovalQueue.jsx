import { useState } from 'react'
import { Image, Check, X, MessageSquare, CheckSquare } from 'lucide-react'
import { Card, CardHeader, Badge, GhostButton } from '../ui'
import { APPROVALS } from '../../data/mockData'
import styles from './ApprovalQueue.module.css'
import clsx from 'clsx'

export default function ApprovalQueue() {
  const [items, setItems] = useState(APPROVALS)
  const [processing, setProcessing] = useState({})

  function handleAction(id, action) {
    setProcessing(p => ({ ...p, [id]: action }))
    setTimeout(() => {
      setItems(prev => prev.filter(a => a.id !== id))
      setProcessing(p => { const n = {...p}; delete n[id]; return n })
    }, 600)
  }

  const pendingCount = items.length

  return (
    <Card>
      <CardHeader
        title="Pending Approval"
        icon={CheckSquare}
        action={
          pendingCount > 0
            ? <Badge variant="warning">{pendingCount} waiting</Badge>
            : <Badge variant="success">All clear</Badge>
        }
      />

      {items.length === 0 ? (
        <div className={styles.empty}>
          <Check size={20} strokeWidth={1.5} />
          <span>No pending approvals</span>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map(item => {
            const isProcessing = !!processing[item.id]
            const action = processing[item.id]
            return (
              <div
                key={item.id}
                className={clsx(
                  styles.item,
                  isProcessing && styles.itemProcessing,
                  action === 'approved' && styles.itemApproved,
                  action === 'rejected' && styles.itemRejected,
                )}
              >
                <div className={styles.iconBox}>
                  <Image size={16} strokeWidth={1.8} />
                </div>

                <div className={styles.info}>
                  <div className={styles.name}>{item.name}</div>
                  <div className={styles.detail}>
                    {item.service} · {item.address}
                  </div>
                  <div className={styles.chips}>
                    <span className={styles.chip}>
                      {item.photoCount > 0
                        ? `${item.photoCount} photo${item.photoCount > 1 ? 's' : ''}`
                        : 'No photos'}
                    </span>
                    <span className={styles.chip}>{item.estimateRange}</span>
                    <span className={styles.chip}>{item.category}</span>
                    <span className={styles.chip}>{item.source}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  {item.photoCount === 0 ? (
                    <GhostButton size="sm">
                      <MessageSquare size={12} strokeWidth={2} />
                      Request photos
                    </GhostButton>
                  ) : (
                    <>
                      <button
                        className={clsx(styles.actionBtn, styles.approveBtn)}
                        onClick={() => handleAction(item.id, 'approved')}
                        disabled={isProcessing}
                      >
                        <Check size={13} strokeWidth={2.5} />
                        Approve
                      </button>
                      <button
                        className={clsx(styles.actionBtn, styles.rejectBtn)}
                        onClick={() => handleAction(item.id, 'rejected')}
                        disabled={isProcessing}
                      >
                        <X size={13} strokeWidth={2.5} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
