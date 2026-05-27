import { useState, useEffect, useCallback } from 'react'
import { Image, MessageSquare, ChevronLeft, ChevronRight, X, Download, Calendar, Smartphone, MapPin, ZoomIn } from 'lucide-react'
import { CUSTOMER_PHOTOS } from '../data/mockData'
import { Badge, Avatar } from '../components/ui'
import styles from './Photos.module.css'
import clsx from 'clsx'

export default function PhotosPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(CUSTOMER_PHOTOS[0])
  const [lightbox, setLightbox] = useState(null) // { photo, index }
  const [filter, setFilter] = useState('all') // 'all' | 'has_photos' | 'needs_photos'

  const filtered = CUSTOMER_PHOTOS.filter(c => {
    if (filter === 'has_photos')    return c.totalPhotos > 0
    if (filter === 'needs_photos')  return c.totalPhotos === 0
    return true
  })

  const totalPhotos = CUSTOMER_PHOTOS.reduce((sum, c) => sum + c.totalPhotos, 0)
  const needingPhotos = CUSTOMER_PHOTOS.filter(c => c.totalPhotos === 0).length

  // Lightbox keyboard nav
  const handleKey = useCallback((e) => {
    if (!lightbox) return
    const photos = selectedCustomer.photos
    if (e.key === 'Escape') setLightbox(null)
    if (e.key === 'ArrowRight') {
      const next = (lightbox.index + 1) % photos.length
      setLightbox({ photo: photos[next], index: next })
    }
    if (e.key === 'ArrowLeft') {
      const prev = (lightbox.index - 1 + photos.length) % photos.length
      setLightbox({ photo: photos[prev], index: prev })
    }
  }, [lightbox, selectedCustomer])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  function openLightbox(photo, index) {
    setLightbox({ photo, index })
  }

  function navLightbox(dir) {
    const photos = selectedCustomer.photos
    const next = (lightbox.index + dir + photos.length) % photos.length
    setLightbox({ photo: photos[next], index: next })
  }

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Photos</h1>
          <p className={styles.pageSubtitle}>Customer-submitted job photos, organized by profile</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statPill}>
            <Image size={13} strokeWidth={2} />
            <span>{totalPhotos} total photos</span>
          </div>
          {needingPhotos > 0 && (
            <div className={clsx(styles.statPill, styles.statPillWarn)}>
              <MessageSquare size={13} strokeWidth={2} />
              <span>{needingPhotos} customers need photos</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {[
          { id: 'all',           label: 'All customers' },
          { id: 'has_photos',    label: 'Has photos' },
          { id: 'needs_photos',  label: 'Needs photos' },
        ].map(f => (
          <button
            key={f.id}
            className={clsx(styles.filterTab, filter === f.id && styles.filterTabActive)}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        {/* Customer list */}
        <aside className={styles.customerList}>
          {filtered.map(customer => (
            <button
              key={customer.customerId}
              className={clsx(
                styles.customerRow,
                selectedCustomer.customerId === customer.customerId && styles.customerRowActive
              )}
              onClick={() => setSelectedCustomer(customer)}
            >
              <Avatar initials={customer.initials} color={customer.avatarColor} size="md" />
              <div className={styles.customerInfo}>
                <div className={styles.customerName}>{customer.name}</div>
                <div className={styles.customerService}>{customer.service}</div>
              </div>
              <div className={styles.customerPhotoCount}>
                {customer.totalPhotos > 0 ? (
                  <span className={styles.photoCountBadge}>
                    <Image size={10} strokeWidth={2} />
                    {customer.totalPhotos}
                  </span>
                ) : (
                  <span className={styles.noPhotosBadge}>—</span>
                )}
              </div>
            </button>
          ))}
        </aside>

        {/* Photo detail panel */}
        <div className={styles.detailPanel}>
          {/* Customer header */}
          <div className={styles.customerHeader}>
            <Avatar initials={selectedCustomer.initials} color={selectedCustomer.avatarColor} size="lg" />
            <div className={styles.customerHeaderInfo}>
              <div className={styles.customerHeaderName}>{selectedCustomer.name}</div>
              <div className={styles.customerHeaderMeta}>
                <span><MapPin size={11} strokeWidth={2} />{selectedCustomer.address}</span>
                <span>·</span>
                <span>{selectedCustomer.service}</span>
                <span>·</span>
                <span>{selectedCustomer.estimateRange}</span>
              </div>
            </div>
            <div className={styles.customerHeaderRight}>
              <Badge variant={selectedCustomer.stageVariant}>{selectedCustomer.stageLabel}</Badge>
              {selectedCustomer.totalPhotos === 0 && (
                <button className={styles.requestBtn}>
                  <MessageSquare size={13} strokeWidth={2} />
                  Request photos via SMS
                </button>
              )}
            </div>
          </div>

          {/* Photo grid or empty state */}
          {selectedCustomer.photos.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Image size={28} strokeWidth={1.2} />
              </div>
              <div className={styles.emptyTitle}>No photos yet</div>
              <div className={styles.emptyDesc}>
                The AI will collect photos from {selectedCustomer.name.split(' ')[0]} via SMS.<br />
                They'll appear here automatically once received.
              </div>
              <button className={styles.requestBtn} style={{ marginTop: '1rem' }}>
                <MessageSquare size={13} strokeWidth={2} />
                Send photo request now
              </button>
            </div>
          ) : (
            <>
              <div className={styles.photoGridHeader}>
                <span className={styles.photoGridLabel}>
                  {selectedCustomer.totalPhotos} photo{selectedCustomer.totalPhotos !== 1 ? 's' : ''}
                  {selectedCustomer.lastPhotoDate && (
                    <span className={styles.photoGridDate}> · Last received {selectedCustomer.lastPhotoDate}</span>
                  )}
                </span>
                <span className={styles.photoGridHint}>Click to enlarge · Arrow keys to navigate</span>
              </div>
              <div className={styles.photoGrid}>
                {selectedCustomer.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    className={styles.photoCard}
                    onClick={() => openLightbox(photo, index)}
                    style={{ '--photo-index': index }}
                  >
                    <div
                      className={styles.photoThumb}
                      style={{ background: photo.bg }}
                    >
                      <div className={styles.photoOverlay}>
                        <ZoomIn size={20} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className={styles.photoMeta}>
                      <span className={styles.photoLabel}>{photo.label}</span>
                      <span className={styles.photoTime}>{photo.receivedAt}</span>
                    </div>
                    <div className={styles.photoFooter}>
                      <span className={styles.photoVia}>
                        <Smartphone size={10} strokeWidth={2} />
                        {photo.via}
                      </span>
                      <span className={styles.photoJob}>{photo.jobId}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
              <X size={18} strokeWidth={2} />
            </button>

            <div className={styles.lightboxImage} style={{ background: lightbox.photo.bg }} />

            {selectedCustomer.photos.length > 1 && (
              <>
                <button className={clsx(styles.lightboxNav, styles.lightboxNavLeft)} onClick={() => navLightbox(-1)}>
                  <ChevronLeft size={20} strokeWidth={2} />
                </button>
                <button className={clsx(styles.lightboxNav, styles.lightboxNavRight)} onClick={() => navLightbox(1)}>
                  <ChevronRight size={20} strokeWidth={2} />
                </button>
              </>
            )}

            <div className={styles.lightboxFooter}>
              <div className={styles.lightboxInfo}>
                <div className={styles.lightboxCustomer}>
                  <Avatar initials={selectedCustomer.initials} color={selectedCustomer.avatarColor} size="sm" />
                  <span>{selectedCustomer.name}</span>
                </div>
                <div className={styles.lightboxDetail}>
                  <span>{lightbox.photo.label}</span>
                  <span>·</span>
                  <span>{lightbox.photo.jobId}</span>
                  <span>·</span>
                  <Calendar size={11} strokeWidth={2} />
                  <span>{lightbox.photo.receivedAt}</span>
                  <span>·</span>
                  <Smartphone size={11} strokeWidth={2} />
                  <span>via {lightbox.photo.via}</span>
                </div>
              </div>
              <div className={styles.lightboxCounter}>
                {lightbox.index + 1} / {selectedCustomer.photos.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
