import { DropdownList } from '@/components/DropdownList'
import { SwitchWithRelatedSettings } from '@/components/SwitchWithRelatedSettings'
import { TextInput } from '@/components/inputs'
import { SwitchWithLabel } from '@/components/inputs/SwitchWithLabel'
import { VariableSearchInput } from '@/components/inputs/VariableSearchInput'
import { FormLabel, Stack } from '@chakra-ui/react'
import { useTranslate } from '@tolgee/react'
import { TextInputBlock, Variable } from '@typebot.io/schemas'
import { fileVisibilityOptions } from '@typebot.io/schemas/features/blocks/inputs/file/constants'
import { defaultTextInputOptions } from '@typebot.io/schemas/features/blocks/inputs/text/constants'
import React from 'react'

type Props = {
  options: TextInputBlock['options']
  onOptionsChange: (options: TextInputBlock['options']) => void
}

export const TextInputSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate()
  const updatePlaceholder = (placeholder: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, placeholder } })

  const updateButtonLabel = (button: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, button } })

  const updateIsLong = (isLong: boolean) =>
    onOptionsChange({ ...options, isLong })

  const updateVariableId = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id })

  const updateAttachmentsEnabled = (isEnabled: boolean) =>
    onOptionsChange({
      ...options,
      attachments: { ...options?.attachments, isEnabled },
    })

  const updateAttachmentsSaveVariableId = (variable?: Pick<Variable, 'id'>) =>
    onOptionsChange({
      ...options,
      attachments: { ...options?.attachments, saveVariableId: variable?.id },
    })

  const updateVisibility = (
    visibility: (typeof fileVisibilityOptions)[number]
  ) =>
    onOptionsChange({
      ...options,
      attachments: { ...options?.attachments, visibility },
    })

  const updateAudioClipEnabled = (isEnabled: boolean) =>
    onOptionsChange({
      ...options,
      audioClip: { ...options?.audioClip, isEnabled },
    })

  const updateAudioClipSaveVariableId = (variable?: Pick<Variable, 'id'>) =>
    onOptionsChange({
      ...options,
      audioClip: { ...options?.audioClip, saveVariableId: variable?.id },
    })

  const updateAudioClipVisibility = (
    visibility: (typeof fileVisibilityOptions)[number]
  ) =>
    onOptionsChange({
      ...options,
      audioClip: { ...options?.audioClip, visibility },
    })

  return (
    <Stack spacing={4}>
      <SwitchWithLabel
        label={t('blocks.inputs.text.settings.longText.label')}
        initialValue={options?.isLong ?? defaultTextInputOptions.isLong}
        onCheckChange={updateIsLong}
      />
      <TextInput
        label={t('blocks.inputs.settings.placeholder.label')}
        defaultValue={
          options?.labels?.placeholder ??
          defaultTextInputOptions.labels.placeholder
        }
        onChange={updatePlaceholder}
      />
      <TextInput
        label={t('blocks.inputs.settings.button.label')}
        defaultValue={
          options?.labels?.button ?? defaultTextInputOptions.labels.button
        }
        onChange={updateButtonLabel}
      />
      <SwitchWithRelatedSettings
        label={'Permitir resposta em áudio'}
        initialValue={
          options?.audioClip?.isEnabled ??
          defaultTextInputOptions.audioClip.isEnabled
        }
        onCheckChange={updateAudioClipEnabled}
      >
        <Stack>
          <FormLabel mb="0" htmlFor="variable">
            Salve os URLs em uma variável:
          </FormLabel>
          <VariableSearchInput
            initialVariableId={options?.audioClip?.saveVariableId}
            onSelectVariable={updateAudioClipSaveVariableId}
          />
        </Stack>
        <DropdownList
          label="Visibilidade:"
          moreInfoTooltip='Esta configuração determina quem pode ver os arquivos enviados. “Público” significa que qualquer pessoa que tenha o link pode ver os arquivos. "Privado" significa que apenas os membros deste espaço de trabalho podem ver os arquivos.'
          currentItem={
            options?.audioClip?.visibility ??
            defaultTextInputOptions.audioClip.visibility
          }
          onItemSelect={updateAudioClipVisibility}
          items={fileVisibilityOptions}
        />
      </SwitchWithRelatedSettings>
      <SwitchWithRelatedSettings
        label={'Permitir anexos'}
        initialValue={
          options?.attachments?.isEnabled ??
          defaultTextInputOptions.attachments.isEnabled
        }
        onCheckChange={updateAttachmentsEnabled}
      >
        <Stack>
          <FormLabel mb="0" htmlFor="variable">
            Salve os URLs em uma variável:
          </FormLabel>
          <VariableSearchInput
            initialVariableId={options?.attachments?.saveVariableId}
            onSelectVariable={updateAttachmentsSaveVariableId}
          />
        </Stack>
        <DropdownList
          label="Visibilidade:"
          moreInfoTooltip='Esta configuração determina quem pode ver os arquivos enviados. “Público” significa que qualquer pessoa que tenha o link pode ver os arquivos. "Privado" significa que apenas os membros deste espaço de trabalho podem ver os arquivos.'
          currentItem={
            options?.attachments?.visibility ??
            defaultTextInputOptions.attachments.visibility
          }
          onItemSelect={updateVisibility}
          items={fileVisibilityOptions}
        />
      </SwitchWithRelatedSettings>
      <Stack>
        <FormLabel mb="0" htmlFor="variable">
          {t('blocks.inputs.settings.saveAnswer.label')}
        </FormLabel>
        <VariableSearchInput
          initialVariableId={options?.variableId}
          onSelectVariable={updateVariableId}
        />
      </Stack>
    </Stack>
  )
}
