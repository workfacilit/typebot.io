import type { Log } from '@typebot.io/prisma'
import type {
  Edge,
  Group,
  PublicTypebot,
  ResultValuesInput,
  Typebot,
  Variable,
  VariableWithUnknowValue,
} from '@typebot.io/schemas'
import type { TypebotViewerProps } from './components/TypebotViewer'
import type { LinkedTypebot } from './providers/TypebotProvider'
import type { SessionState } from '@typebot.io/schemas'
import type { SetVariableHistoryItem } from '@typebot.io/schemas'
import type { ContinueChatResponse } from '@typebot.io/schemas'

export type InputSubmitContent = {
  label?: string
  value: string
  itemId?: string
}

export type EdgeId = string

export type ExecuteLogicResponse = {
  outgoingEdgeId: string | undefined
  newSessionState?: SessionState
  newSetVariableHistory?: SetVariableHistoryItem[]
} & Pick<ContinueChatResponse, 'clientSideActions' | 'logs'>

export type LogicState = {
  isPreview: boolean
  apiHost: string
  typebot: TypebotViewerProps['typebot']
  linkedTypebots: LinkedTypebot[]
  currentTypebotId: string
  pushParentTypebotId: (id: string) => void
  pushEdgeIdInLinkedTypebotQueue: (bot: {
    edgeId: string
    typebotId: string
  }) => void
  setCurrentTypebotId: (id: string) => void
  updateVariableValue: (variableId: string, value: unknown) => void
  updateVariables: (variables: VariableWithUnknowValue[]) => void
  injectLinkedTypebot: (typebot: Typebot | PublicTypebot) => LinkedTypebot
  onNewLog: (log: Omit<Log, 'id' | 'createdAt' | 'resultId'>) => void
  createEdge: (edge: Edge) => void
}

export type IntegrationState = {
  apiHost: string
  typebotId: string
  groupId: string
  blockId: string
  isPreview: boolean
  variables: Variable[]
  resultValues: ResultValuesInput
  groups: Group[]
  resultId?: string
  parentTypebotIds: string[]
  updateVariables: (variables: VariableWithUnknowValue[]) => void
  updateVariableValue: (variableId: string, value: unknown) => void
  onNewLog: (log: Omit<Log, 'id' | 'createdAt' | 'resultId'>) => void
}
