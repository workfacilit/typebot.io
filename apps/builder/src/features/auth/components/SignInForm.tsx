import {
  Button,
  HTMLChakraProps,
  Input,
  Stack,
  HStack,
  Text,
  Spinner,
  Alert,
  Flex,
  AlertIcon,
  SlideFade,
} from '@chakra-ui/react'
import React, { ChangeEvent, FormEvent, useEffect } from 'react'
import { useState } from 'react'
import {
  ClientSafeProvider,
  getProviders,
  LiteralUnion,
  signIn,
  useSession,
} from 'next-auth/react'
import { DividerWithText } from './DividerWithText'
import { SocialLoginButtons } from './SocialLoginButtons'
import { useRouter } from 'next/router'
import { BuiltInProviderType } from 'next-auth/providers'
import { useToast } from '@/hooks/useToast'
import { TextLink } from '@/components/TextLink'
import { SignInError } from './SignInError'
import { useTranslate } from '@tolgee/react'
import { sanitizeUrl } from '@braintree/sanitize-url'

type Props = {
  defaultEmail?: string
}

export const SignInForm = ({
  defaultEmail,
}: Props & HTMLChakraProps<'form'>) => {
  const { t } = useTranslate()
  const router = useRouter()
  const { status } = useSession()
  const [authLoading, setAuthLoading] = useState(false)
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)

  const [emailValue, setEmailValue] = useState(defaultEmail ?? '')
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)

  const { showToast } = useToast()
  const [providers, setProviders] =
    useState<
      Record<LiteralUnion<BuiltInProviderType, string>, ClientSafeProvider>
    >()

  const hasNoAuthProvider =
    !isLoadingProviders && Object.keys(providers ?? {}).length === 0

  useEffect(() => {
    const emailFromQuery = router.query.setEmail?.toString()
    if (emailFromQuery) {
      setEmailValue(emailFromQuery)
    }
  }, [router.isReady, router.query.setEmail])

  useEffect(() => {
    if (emailValue && router.query.setEmail) {
      handleEmailSubmit(new Event('submit') as unknown as FormEvent) // Dispara o submit depois que emailValue é atualizado
    }
  }, [emailValue])

  useEffect(() => {
    if (status === 'authenticated') {
      const redirectPath = router.query.redirectPath?.toString()
      router.replace(redirectPath ? sanitizeUrl(redirectPath) : '/typebots')
      return
    }
    ;(async () => {
      const providers = await getProviders()
      setProviders(providers ?? undefined)
      setIsLoadingProviders(false)
    })()
  }, [status, router])

  useEffect(() => {
    if (!router.isReady) return
    if (router.query.error === 'ip-banned') {
      showToast({
        status: 'info',
        description:
          'Your account has suspicious activity and is being reviewed by our team. Feel free to contact us.',
      })
    }
  }, [router.isReady, router.query.error, showToast])

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) =>
    setEmailValue(e.target.value)

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isMagicLinkSent) return
    setAuthLoading(true)
    try {
      const response = await signIn('email', {
        email: emailValue,
        redirect: false,
      })
      if (response?.error) {
        if (response.error.includes('rate-limited'))
          showToast({
            status: 'info',
            description: t('auth.signinErrorToast.tooManyRequests'),
          })
        else if (response.error.includes('sign-up-disabled'))
          showToast({
            title: t('auth.signinErrorToast.title'),
            description: t('auth.signinErrorToast.description'),
          })
        else
          showToast({
            status: 'info',
            description: t('errorMessage'),
            details: {
              content: 'Check server logs to see relevent error message.',
              lang: 'json',
            },
          })
      } else {
        setIsMagicLinkSent(true)
      }
    } catch (error) {
      showToast({
        status: 'info',
        description: 'An error occurred while signing in',
      })
    }
    setAuthLoading(false)
  }

  if (emailValue) return <Spinner />
  if (hasNoAuthProvider)
    return (
      <Text>
        {t('auth.noProvider.preLink')}{' '}
        <TextLink
          href="https://docs.typebot.io/self-hosting/configuration"
          isExternal
        >
          {t('auth.noProvider.link')} ddsds
        </TextLink>
      </Text>
    )
  return (
    <Stack spacing="4" w="330px">
      {!isMagicLinkSent && (
        <>
          <SocialLoginButtons providers={providers} />
          {providers?.email && (
            <>
              <DividerWithText mt="6">{t('auth.orEmailLabel')}</DividerWithText>
              <HStack as="form" onSubmit={handleEmailSubmit}>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="email@company.com"
                  required
                  value={emailValue}
                  onChange={handleEmailChange}
                />
                <Button
                  type="submit"
                  isLoading={
                    ['loading', 'authenticated'].includes(status) || authLoading
                  }
                  isDisabled={isMagicLinkSent}
                >
                  {t('auth.emailSubmitButton.label')}
                </Button>
              </HStack>
            </>
          )}
        </>
      )}
      {router.query.error && (
        <SignInError error={router.query.error.toString()} />
      )}
      <SlideFade offsetY="20px" in={isMagicLinkSent} unmountOnExit>
        <Flex>
          <Alert status="success" w="100%">
            <HStack>
              <AlertIcon />
              <Stack spacing={1}>
                <Text fontWeight="semibold">
                  {t('auth.magicLink.title')}cxcx
                </Text>
                <Text fontSize="sm">{t('auth.magicLink.description')}</Text>
              </Stack>
            </HStack>
          </Alert>
        </Flex>
      </SlideFade>
    </Stack>
  )
}
