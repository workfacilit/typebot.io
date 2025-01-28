import type { WebhookBlock } from './schema'
import type { ExecuteLogicResponse } from '../../../types'

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
