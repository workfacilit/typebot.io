import { CopyButton } from '@/components/CopyButton'
import { ChevronLeftIcon, ExternalLinkIcon } from '@/components/icons'
import { TextInput } from '@/components/inputs/TextInput'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { useToast } from '@/hooks/useToast'
import { trpc, trpcVanilla } from '@/lib/trpc'
import {
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Stack,
  ModalFooter,
  Stepper,
  useSteps,
  Step,
  StepIndicator,
  Box,
  StepIcon,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  UnorderedList,
  ListItem,
  Text,
  Image,
  Button,
  HStack,
  IconButton,
  Heading,
  OrderedList,
  Link,
  Code,
  Input,
  InputGroup,
  InputRightElement,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
} from '@chakra-ui/react'
import { env } from '@typebot.io/env'
import { isEmpty, isNotEmpty } from '@typebot.io/lib/utils'
import React, { useState } from 'react'
import { createId } from '@paralleldrive/cuid2'

const steps = [
  { title: 'Requisitos' },
  { title: 'Token do Usuário' },
  { title: 'Numero' },
  { title: 'Webhook' },
]

type Props = {
  isOpen: boolean
  onClose: () => void
  onNewCredentials: (id: string) => void
}

const credentialsId = createId()

export const WhatsAppCredentialsModal = ({
  isOpen,
  onClose,
  onNewCredentials,
}: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <WhatsAppCreateModalContent
        onNewCredentials={onNewCredentials}
        onClose={onClose}
      />
    </Modal>
  )
}

export const WhatsAppCreateModalContent = ({
  onNewCredentials,
  onClose,
}: Pick<Props, 'onNewCredentials' | 'onClose'>) => {
  const { workspace } = useWorkspace()
  const { showToast } = useToast()
  const { activeStep, goToNext, goToPrevious, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })
  const [systemUserAccessToken, setSystemUserAccessToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [phoneNumberName, setPhoneNumberName] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const {
    credentials: {
      listCredentials: { refetch: refetchCredentials },
    },
  } = trpc.useContext()

  const { mutate } = trpc.credentials.createCredentials.useMutation({
    onMutate: () => setIsCreating(true),
    onSettled: () => setIsCreating(false),
    onError: (err) => {
      showToast({
        description: err.message,
        status: 'error',
      })
    },
    onSuccess: (data) => {
      refetchCredentials()
      onNewCredentials(data.credentialsId)
      onClose()
      resetForm()
    },
  })

  const { data: tokenInfoData } =
    trpc.whatsAppInternal.getSystemTokenInfo.useQuery(
      {
        token: systemUserAccessToken,
      },
      { enabled: isNotEmpty(systemUserAccessToken) }
    )

  const resetForm = () => {
    setActiveStep(0)
    setSystemUserAccessToken('')
    setPhoneNumberId('')
  }

  const createMetaCredentials = async () => {
    if (!workspace) return
    mutate({
      credentials: {
        id: credentialsId,
        type: 'whatsApp',
        workspaceId: workspace.id,
        name: phoneNumberName,
        data: {
          systemUserAccessToken,
          phoneNumberId,
        },
      },
    })
  }

  const isTokenValid = async () => {
    setIsVerifying(true)
    try {
      const { expiresAt, scopes } =
        await trpcVanilla.whatsAppInternal.getSystemTokenInfo.query({
          token: systemUserAccessToken,
        })
      if (expiresAt !== 0) {
        showToast({
          description:
            'Token expiration was not set to *never*. Create the token again with the correct expiration.',
        })
        return false
      }
      if (
        ['whatsapp_business_management', 'whatsapp_business_messaging'].find(
          (scope) => !scopes.includes(scope)
        )
      ) {
        showToast({
          description: 'Token does not have all the necessary scopes',
        })
        return false
      }
    } catch (err) {
      setIsVerifying(false)
      showToast({
        description: 'Could not get system info',
        details:
          err instanceof Error
            ? { content: err.message, lang: 'json' }
            : undefined,
      })
      return false
    }
    setIsVerifying(false)
    return true
  }

  const isPhoneNumberAvailable = async () => {
    setIsVerifying(true)
    try {
      const { name } = await trpcVanilla.whatsAppInternal.getPhoneNumber.query({
        systemToken: systemUserAccessToken,
        phoneNumberId,
      })
      setPhoneNumberName(name)
      try {
        const { message } =
          await trpcVanilla.whatsAppInternal.verifyIfPhoneNumberAvailable.query(
            {
              phoneNumberDisplayName: name,
            }
          )

        if (message === 'taken') {
          setIsVerifying(false)
          showToast({
            description: 'Phone number is already registered on Typebot',
          })
          return false
        }
        const { verificationToken } =
          await trpcVanilla.whatsAppInternal.generateVerificationToken.mutate()
        setVerificationToken(verificationToken)
      } catch (err) {
        console.error(err)
        setIsVerifying(false)
        showToast({
          description: 'Could not verify if phone number is available',
        })
        return false
      }
    } catch (err) {
      console.error(err)
      setIsVerifying(false)
      showToast({
        description: 'Could not get phone number info',
        details:
          err instanceof Error
            ? { content: err.message, lang: 'json' }
            : undefined,
      })
      return false
    }
    setIsVerifying(false)
    return true
  }

  const goToNextStep = async () => {
    if (activeStep === steps.length - 1) return createMetaCredentials()
    if (activeStep === 1 && !(await isTokenValid())) return
    if (activeStep === 2 && !(await isPhoneNumberAvailable())) return

    goToNext()
  }
  return (
    <ModalContent>
      <ModalHeader>
        <HStack h="40px">
          {activeStep > 0 && (
            <IconButton
              icon={<ChevronLeftIcon />}
              aria-label={'Go back'}
              variant="ghost"
              onClick={goToPrevious}
            />
          )}
          <Heading size="md">
            Adicione um número de telefone do WhatsApp
          </Heading>
        </HStack>
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody as={Stack} spacing="10">
        <Stepper index={activeStep} size="sm" pt="4">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>

              <Box flexShrink="0">
                <StepTitle>{step.title}</StepTitle>
              </Box>

              <StepSeparator />
            </Step>
          ))}
        </Stepper>
        {activeStep === 0 && <Requirements />}
        {activeStep === 1 && (
          <SystemUserToken
            initialToken={systemUserAccessToken}
            setToken={setSystemUserAccessToken}
          />
        )}
        {activeStep === 2 && (
          <PhoneNumber
            appId={tokenInfoData?.appId}
            initialPhoneNumberId={phoneNumberId}
            setPhoneNumberId={setPhoneNumberId}
          />
        )}
        {activeStep === 3 && (
          <Webhook
            appId={tokenInfoData?.appId}
            verificationToken={verificationToken}
            credentialsId={credentialsId}
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={goToNextStep}
          colorScheme="blue"
          isDisabled={
            (activeStep === 1 && isEmpty(systemUserAccessToken)) ||
            (activeStep === 2 && isEmpty(phoneNumberId))
          }
          isLoading={isVerifying || isCreating}
        >
          {activeStep === steps.length - 1 ? 'Submit' : 'Continue'}
        </Button>
      </ModalFooter>
    </ModalContent>
  )
}

const Requirements = () => (
  <Stack spacing={4}>
    <Text>Clique no Tutorial abaixo se ainda não tem um aplicativo Meta:</Text>
    <Accordion allowToggle>
      <AccordionItem>
        <AccordionButton justifyContent="space-between">
          Crie um aplicativo WhatsApp Meta
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel as={Stack} spacing="4" pt="4">
          <Text fontSize="lg" as="b">
            Crie uma conta comercial no Facebook
          </Text>
          <OrderedList spacing={4}>
            <ListItem>
              Acesse
              <Button
                as={Link}
                href="https://business.facebook.com"
                isExternal
                rightIcon={<ExternalLinkIcon />}
                size="sm"
              >
                Acessar conta Comercial Meta
              </Button>{' '}
              e faça login
            </ListItem>
            <ListItem>
              <Text>
                Crie uma nova conta comercial na barra lateral esquerda
              </Text>
            </ListItem>
            <Alert status="info">
              <AlertIcon />É possível que o Meta restrinja automaticamente sua
              conta Business recém-criada. Nesse caso, certifique-se de
              verificar sua identidade para prosseguir.
            </Alert>
          </OrderedList>
          <Text fontSize="lg" as="b">
            Crie um aplicativo Meta
          </Text>
          <OrderedList spacing={4}>
            <ListItem>
              Acesse
              <Button
                as={Link}
                href="https://developers.facebook.com/apps"
                isExternal
                rightIcon={<ExternalLinkIcon />}
                size="sm"
              >
                Página de Apps da Meta
              </Button>
            </ListItem>
            <ListItem>Clique em Criar aplicativo</ListItem>
            <ListItem>
              “O que você quer que seu aplicativo faça?”, selecione{' '}
              <Code>Outro</Code>.
            </ListItem>
            <ListItem>
              Selecione o tipo <Code>Empresa</Code>.
            </ListItem>
            <ListItem>
              Dê a ele qualquer nome e selecione sua conta comercial
              recém-criada
            </ListItem>
            <ListItem>
              Na página do aplicativo, procure o produto <Code>WhatsApp</Code> e
              ative-o
            </ListItem>
          </OrderedList>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
    <Text>
      Se tiver um aplicativo Meta você deve ver uma página parecida como na
      imagem abaixo:
    </Text>
    <Image
      src="/images/whatsapp-quickstart-page.png"
      alt="WhatsApp quickstart page"
      rounded="md"
    />
  </Stack>
)

const SystemUserToken = ({
  initialToken,
  setToken,
}: {
  initialToken: string
  setToken: (id: string) => void
}) => (
  <OrderedList spacing={4}>
    <ListItem>
      Entre em{' '}
      <Button
        as={Link}
        href="https://business.facebook.com/settings/system-users"
        isExternal
        rightIcon={<ExternalLinkIcon />}
        size="sm"
      >
        Página de usuários do sistema
      </Button>
    </ListItem>
    <ListItem>
      Crie um novo usuário clicando em <Code>Adicionar</Code>
    </ListItem>
    <ListItem>
      Preencha-o com qualquer nome e atribua a ele a{' '}
      <Code>função de administrador</Code>
    </ListItem>
    <ListItem>
      <Stack>
        <Text>
          Clique em <Code>Adicionar ativos</Code>. Em <Code>Aplicativos</Code>,
          procure seu aplicativo criado anteriormente, selecione-o e verifique{' '}
          <Code>Gerenciar aplicativo</Code>
        </Text>
        <Image
          src="/images/meta-system-user-assets.png"
          alt="Meta system user assets"
          rounded="md"
        />
      </Stack>
    </ListItem>
    <ListItem>
      <Stack spacing={4}>
        <Text>
          Agora, clique em <Code>Gerar novo token</Code>. Selecione seu
          aplicativo.
        </Text>
        <UnorderedList spacing={4}>
          <ListItem>
            Token expiração: <Code>Nunca</Code>
          </ListItem>
          <ListItem>
            Permissões disponíveis: <Code>whatsapp_business_messaging</Code>,{' '}
            <Code>whatsapp_business_management</Code>{' '}
          </ListItem>
        </UnorderedList>
      </Stack>
    </ListItem>
    <ListItem>Copie e cole o token gerado:</ListItem>
    <TextInput
      isRequired
      type="password"
      label="Token de usuário do sistema"
      defaultValue={initialToken}
      onChange={(val) => setToken(val.trim())}
      withVariableButton={false}
      debounceTimeout={0}
    />
  </OrderedList>
)

const PhoneNumber = ({
  appId,
  initialPhoneNumberId,
  setPhoneNumberId,
}: {
  appId?: string
  initialPhoneNumberId: string
  setPhoneNumberId: (id: string) => void
}) => (
  <OrderedList spacing={4}>
    <ListItem>
      <HStack>
        <Text>
          Vá para sua{' '}
          <Button
            as={Link}
            href={`https://developers.facebook.com/apps/${appId}/whatsapp-business/wa-dev-console`}
            isExternal
            rightIcon={<ExternalLinkIcon />}
            size="sm"
          >
            WhatsApp Dev Console{' '}
          </Button>
        </Text>
      </HStack>
    </ListItem>
    <ListItem>
      Adicione seu número de telefone clicando no botão{' '}
      <Code>Adicionar número de telefone</Code>
    </ListItem>
    <ListItem>
      <Stack>
        <Text>
          Selecione um número de telefone e cole o <Code>Phone number ID</Code>:
        </Text>
        <HStack>
          <TextInput
            label="Phone number ID"
            defaultValue={initialPhoneNumberId}
            withVariableButton={false}
            debounceTimeout={0}
            isRequired
            onChange={setPhoneNumberId}
          />
        </HStack>
        <Image
          src="/images/whatsapp-phone-selection.png"
          alt="Selecione o numero WA"
        />
      </Stack>
    </ListItem>
  </OrderedList>
)

const Webhook = ({
  appId,
  verificationToken,
  credentialsId,
}: {
  appId?: string
  verificationToken: string
  credentialsId: string
}) => {
  const { workspace } = useWorkspace()
  const webhookUrl = `${
    env.NEXT_PUBLIC_VIEWER_URL.at(1) ?? env.NEXT_PUBLIC_VIEWER_URL[0]
  }/api/v1/workspaces/${workspace?.id}/whatsapp/${credentialsId}/webhook`

  return (
    <Stack spacing={6}>
      <Text>
        Em{' '}
        <Button
          as={Link}
          href={`https://developers.facebook.com/apps/${appId}/whatsapp-business/wa-settings`}
          rightIcon={<ExternalLinkIcon />}
          isExternal
          size="sm"
        >
          Configurações do WhatsApp
        </Button>
        , clique no botão Editar e insira os seguintes valores:
      </Text>
      <UnorderedList spacing={6}>
        <ListItem>
          <HStack>
            <Text flexShrink={0}>Callback URL:</Text>
            <InputGroup size="sm">
              <Input type={'text'} defaultValue={webhookUrl} />
              <InputRightElement width="60px">
                <CopyButton size="sm" textToCopy={webhookUrl} />
              </InputRightElement>
            </InputGroup>
          </HStack>
        </ListItem>
        <ListItem>
          <HStack>
            <Text flexShrink={0}>Verify Token:</Text>
            <InputGroup size="sm">
              <Input type={'text'} defaultValue={verificationToken} />
              <InputRightElement width="60px">
                <CopyButton size="sm" textToCopy={verificationToken} />
              </InputRightElement>
            </InputGroup>
          </HStack>
        </ListItem>
        <ListItem>
          <HStack>
            <Text flexShrink={0}>
              Campos de webhook: verificar <Code>mensagens</Code>
            </Text>
          </HStack>
        </ListItem>
      </UnorderedList>
    </Stack>
  )
}
