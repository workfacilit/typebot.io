import type { ExecuteLogicResponse } from '@/types'
import type { WebhookBlock } from '@typebot.io/schemas'

export const executeWebhookRequestBlock = (
  block: WebhookBlock
): ExecuteLogicResponse => ({
  outgoingEdgeId: block.outgoingEdgeId,
  clientSideActions: [
    {
      type: 'listenForWebhook',
      expectsDedicatedReply: true,
    },
  ],
})
