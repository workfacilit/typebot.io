import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Heading,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Stack,
  Text,
  OrderedList,
  ListItem,
  HStack,
  useDisclosure,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
} from '@chakra-ui/react'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { CredentialsDropdown } from '@/features/credentials/components/CredentialsDropdown'
import { ModalProps } from '../../EmbedButton'
import { useTypebot } from '@/features/editor/providers/TypebotProvider'
import { WhatsAppCredentialsModal } from './WhatsAppCredentialsModal'
import { TextLink } from '@/components/TextLink'
import { PublishButton } from '../../../PublishButton'
import { useParentModal } from '@/features/graph/providers/ParentModalProvider'
import { trpc } from '@/lib/trpc'
import { SwitchWithLabel } from '@/components/inputs/SwitchWithLabel'
import { TableList } from '@/components/TableList'
import { Comparison } from '@typebot.io/schemas'
import { DropdownList } from '@/components/DropdownList'
import { WhatsAppComparisonItem } from './WhatsAppComparisonItem'
import { AlertInfo } from '@/components/AlertInfo'
import { NumberInput } from '@/components/inputs'
import { defaultSessionExpiryTimeout } from '@typebot.io/schemas/features/whatsapp'
import { SwitchWithRelatedSettings } from '@/components/SwitchWithRelatedSettings'
import { isDefined } from '@typebot.io/lib/utils'
import { hasProPerks } from '@/features/billing/helpers/hasProPerks'
import { UnlockPlanAlertInfo } from '@/components/UnlockPlanAlertInfo'
import { PlanTag } from '@/features/billing/components/PlanTag'
import { LogicalOperator } from '@typebot.io/schemas/features/blocks/logic/condition/constants'

export const WhatsAppModal = ({ isOpen, onClose }: ModalProps): JSX.Element => {
  const { typebot, updateTypebot, isPublished } = useTypebot()
  const { ref } = useParentModal()
  const { workspace } = useWorkspace()
  const {
    isOpen: isCredentialsModalOpen,
    onOpen,
    onClose: onCredentialsModalClose,
  } = useDisclosure()

  const whatsAppSettings = typebot?.settings.whatsApp

  const { data: phoneNumberData } =
    trpc.whatsAppInternal.getPhoneNumber.useQuery(
      {
        credentialsId: typebot?.whatsAppCredentialsId as string,
      },
      {
        enabled: !!typebot?.whatsAppCredentialsId,
      }
    )

  const toggleEnableWhatsApp = (isChecked: boolean) => {
    if (!phoneNumberData?.id || !typebot) return
    updateTypebot({
      updates: {
        settings: {
          ...typebot.settings,
          whatsApp: {
            ...typebot.settings.whatsApp,
            isEnabled: isChecked,
          },
        },
      },
    })
  }

  const updateCredentialsId = (credentialsId: string | undefined) => {
    if (!typebot) return
    updateTypebot({
      updates: {
        whatsAppCredentialsId: credentialsId,
      },
    })
  }

  const updateStartConditionComparisons = (comparisons: Comparison[]) => {
    if (!typebot) return
    updateTypebot({
      updates: {
        settings: {
          ...typebot.settings,
          whatsApp: {
            ...typebot.settings.whatsApp,
            startCondition: {
              logicalOperator:
                typebot.settings.whatsApp?.startCondition?.logicalOperator ??
                LogicalOperator.AND,
              comparisons,
            },
          },
        },
      },
    })
  }

  const updateStartConditionLogicalOperator = (
    logicalOperator: LogicalOperator
  ) => {
    if (!typebot) return
    updateTypebot({
      updates: {
        settings: {
          ...typebot.settings,
          whatsApp: {
            ...typebot.settings.whatsApp,
            startCondition: {
              comparisons:
                typebot.settings.whatsApp?.startCondition?.comparisons ?? [],
              logicalOperator,
            },
          },
        },
      },
    })
  }

  const updateIsStartConditionEnabled = (isEnabled: boolean) => {
    if (!typebot) return
    updateTypebot({
      updates: {
        settings: {
          ...typebot.settings,
          whatsApp: {
            ...typebot.settings.whatsApp,
            startCondition: !isEnabled
              ? undefined
              : {
                  comparisons: [],
                  logicalOperator: LogicalOperator.AND,
                },
          },
        },
      },
    })
  }

  const updateSessionExpiryTimeout = (sessionExpiryTimeout?: number) => {
    if (
      !typebot ||
      (sessionExpiryTimeout &&
        (sessionExpiryTimeout <= 0 || sessionExpiryTimeout > 48))
    )
      return
    updateTypebot({
      updates: {
        settings: {
          ...typebot.settings,
          whatsApp: {
            ...typebot.settings.whatsApp,
            sessionExpiryTimeout,
          },
        },
      },
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent ref={ref}>
        <ModalHeader>
          <Heading size="md">WhatsApp</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody as={Stack} spacing="6">
          {!hasProPerks(workspace) && (
            <UnlockPlanAlertInfo excludedPlans={['STARTER']}>
              Atualize seu espaço de trabalho para <PlanTag plan="PRO" /> para
              poder ativar a integração do WhatsApp.
            </UnlockPlanAlertInfo>
          )}
          {!isPublished && phoneNumberData?.id && (
            <AlertInfo>
              Você tem modificações que podem ser publicadas.
            </AlertInfo>
          )}
          <OrderedList spacing={4} pl="4">
            <ListItem>
              <HStack>
                <Text>Selecione um número de telefone:</Text>
                {workspace && (
                  <>
                    <WhatsAppCredentialsModal
                      isOpen={isCredentialsModalOpen}
                      onClose={onCredentialsModalClose}
                      onNewCredentials={updateCredentialsId}
                    />
                    <CredentialsDropdown
                      type="whatsApp"
                      workspaceId={workspace.id}
                      currentCredentialsId={
                        typebot?.whatsAppCredentialsId ?? undefined
                      }
                      onCredentialsSelect={updateCredentialsId}
                      onCreateNewClick={onOpen}
                      credentialsName="Numero do WA"
                      size="sm"
                    />
                  </>
                )}
              </HStack>
            </ListItem>
            {typebot?.whatsAppCredentialsId && (
              <>
                <ListItem>
                  <Accordion allowToggle>
                    <AccordionItem>
                      <AccordionButton justifyContent="space-between">
                        Configurar integração
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel as={Stack} spacing="4" pt="4">
                        <HStack>
                          <NumberInput
                            max={48}
                            min={0}
                            width="100px"
                            label="Tempo limite de expiração da sessão:"
                            defaultValue={
                              whatsAppSettings?.sessionExpiryTimeout
                            }
                            placeholder={defaultSessionExpiryTimeout.toString()}
                            moreInfoTooltip="Um número entre 0 e 48 que representa o tempo em horas após o qual a sessão expirará caso o usuário não interaja com o bot. A conversa será reiniciada se o usuário enviar uma mensagem após esse prazo de expiração."
                            onValueChange={updateSessionExpiryTimeout}
                            withVariableButton={false}
                            suffix="hora(s)"
                          />
                        </HStack>
                        <SwitchWithRelatedSettings
                          label={'Iniciar condição do bot'}
                          initialValue={isDefined(
                            whatsAppSettings?.startCondition
                          )}
                          onCheckChange={updateIsStartConditionEnabled}
                        >
                          <TableList<Comparison>
                            initialItems={
                              whatsAppSettings?.startCondition?.comparisons ??
                              []
                            }
                            onItemsChange={updateStartConditionComparisons}
                            ComponentBetweenItems={() => (
                              <Flex justify="center">
                                <DropdownList
                                  currentItem={
                                    whatsAppSettings?.startCondition
                                      ?.logicalOperator
                                  }
                                  onItemSelect={
                                    updateStartConditionLogicalOperator
                                  }
                                  items={Object.values(LogicalOperator)}
                                  size="sm"
                                />
                              </Flex>
                            )}
                            addLabel="Adicione uma comparação"
                          >
                            {(props) => <WhatsAppComparisonItem {...props} />}
                          </TableList>
                        </SwitchWithRelatedSettings>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </ListItem>

                <ListItem>
                  <SwitchWithLabel
                    isDisabled={!hasProPerks(workspace)}
                    label="Habilite a integração do WhatsApp"
                    initialValue={
                      typebot?.settings.whatsApp?.isEnabled ?? false
                    }
                    onCheckChange={toggleEnableWhatsApp}
                    justifyContent="flex-start"
                  />
                </ListItem>
                <ListItem>
                  <HStack>
                    <Text>Publique seu bot:</Text>
                    <PublishButton size="sm" isMoreMenuDisabled />
                  </HStack>
                </ListItem>
                {phoneNumberData?.id && (
                  <ListItem>
                    <TextLink
                      href={`https://wa.me/${phoneNumberData.name}?text=Start`}
                      isExternal
                    >
                      Experimente
                    </TextLink>
                  </ListItem>
                )}
              </>
            )}
          </OrderedList>
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  )
}
