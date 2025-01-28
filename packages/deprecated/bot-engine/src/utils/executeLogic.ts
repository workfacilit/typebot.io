import type { TypebotViewerProps } from '@/components/TypebotViewer'
import { executeCondition } from '@/features/blocks/logic/condition'
import { executeRedirect } from '@/features/blocks/logic/redirect'
import { executeSetVariable } from '@/features/blocks/logic/setVariable'
import { executeTypebotLink } from '@/features/blocks/logic/typebotLink'
import { executeWait } from '@/features/blocks/logic/wait'
import type { LinkedTypebot } from '@/providers/TypebotProvider'
import type { EdgeId, LogicState } from '@/types'
import type { LogicBlock } from '@typebot.io/schemas'
import { executeScript } from '@/features/blocks/logic/script/executeScript'
import { LogicBlockType } from '@typebot.io/schemas/features/blocks/logic/constants'
import { executeWebhookRequestBlock } from '@/features/blocks/logic/webhookRequest'

export const executeLogic = async (
  block: LogicBlock,
  context: LogicState
): Promise<{
  nextEdgeId?: EdgeId
  linkedTypebot?: TypebotViewerProps['typebot'] | LinkedTypebot
  blockedPopupUrl?: string
}> => {
  switch (block.type) {
    case LogicBlockType.SET_VARIABLE:
      return { nextEdgeId: executeSetVariable(block, context) }
    case LogicBlockType.CONDITION:
      return { nextEdgeId: executeCondition(block, context) }
    case LogicBlockType.REDIRECT:
      return executeRedirect(block, context)
    case LogicBlockType.SCRIPT:
      return { nextEdgeId: await executeScript(block, context) }
    case LogicBlockType.TYPEBOT_LINK:
      return executeTypebotLink(block, context)
    case LogicBlockType.WAIT:
      return { nextEdgeId: await executeWait(block, context) }
    case LogicBlockType.WEBHOOK_REQUEST:
      return { nextEdgeId: await executeWebhookRequestBlock(block) }
    default:
      return {}
  }
}
