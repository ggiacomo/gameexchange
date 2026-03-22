'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { sendMessage } from '@/app/(main)/inbox/actions'
import { formatRelativeDate } from '@/lib/utils/format'
import type { MessageRow, UserRow } from '@/types/database'
import { cn } from '@/lib/utils/cn'
import { Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChatClientProps {
  proposalId: string
  currentUserId: string
  messages: (MessageRow & { sender: UserRow })[]
  isReadOnly: boolean
}

export function ChatClient({
  proposalId,
  currentUserId,
  messages,
  isReadOnly,
}: ChatClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    const { error } = await sendMessage(proposalId, content)
    setSending(false)
    if (error) {
      toast({ title: error, variant: 'destructive' })
      return
    }
    setContent('')
    router.refresh()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4">
        {messages.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            No messages yet. Say hi! 👋
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={cn('flex gap-3', isOwn && 'flex-row-reverse')}
            >
              {!isOwn && (
                <Avatar
                  src={msg.sender.avatar_url}
                  alt={msg.sender.username}
                  fallback={msg.sender.username}
                  size="sm"
                />
              )}
              <div className={cn('max-w-[70%]', isOwn && 'items-end flex flex-col')}>
                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-sm',
                    isOwn
                      ? 'bg-brand text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 px-1">
                  {formatRelativeDate(msg.created_at)}
                  {isOwn && msg.read_at && ' · Read'}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {!isReadOnly && (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 flex items-end gap-3">
          <textarea
            className="flex-1 resize-none text-sm outline-none min-h-[40px] max-h-[120px] py-2 px-1"
            placeholder="Type a message... (Enter to send)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            rows={1}
          />
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400">{content.length}/1000</span>
            <Button
              size="icon"
              onClick={handleSend}
              isLoading={sending}
              disabled={!content.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
