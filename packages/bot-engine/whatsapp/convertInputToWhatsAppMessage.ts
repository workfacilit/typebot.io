import { ButtonItem, ContinueChatResponse } from '@typebot.io/schemas'
import { WhatsAppSendingMessage } from '@typebot.io/schemas/features/whatsapp'
import { isDefined, isEmpty } from '@typebot.io/lib/utils'
import { BubbleBlockType } from '@typebot.io/schemas/features/blocks/bubbles/constants'
import { InputBlockType } from '@typebot.io/schemas/features/blocks/inputs/constants'
import { defaultPictureChoiceOptions } from '@typebot.io/schemas/features/blocks/inputs/pictureChoice/constants'
import { convertRichTextToMarkdown } from '@typebot.io/lib/markdown/convertRichTextToMarkdown'
import { env } from '@typebot.io/env'

export const convertInputToWhatsAppMessages = (
  input: NonNullable<ContinueChatResponse['input']>,
  lastMessage: ContinueChatResponse['messages'][number] | undefined
): WhatsAppSendingMessage[] => {
  const lastMessageText =
    lastMessage?.type === BubbleBlockType.TEXT
      ? convertRichTextToMarkdown(lastMessage.content.richText ?? [], {
          flavour: 'whatsapp',
        })
      : undefined

  switch (input.type) {
    case InputBlockType.DATE:
    case InputBlockType.EMAIL:
    case InputBlockType.FILE:
    case InputBlockType.NUMBER:
    case InputBlockType.PHONE:
    case InputBlockType.URL:
    case InputBlockType.PAYMENT:
    case InputBlockType.RATING:
    case InputBlockType.TEXT:
      return []

    case InputBlockType.PICTURE_CHOICE: {
      if (
        input.options?.isMultipleChoice ??
        defaultPictureChoiceOptions.isMultipleChoice
      ) {
        return input.items.flatMap((item, idx) => {
          let bodyText = ''
          if (item.title) bodyText += `*${item.title}*`
          if (item.description) {
            if (item.title) bodyText += '\n\n'
            bodyText += item.description
          }
          const imageMessage = item.pictureSrc
            ? ({
                type: 'image',
                image: {
                  link: item.pictureSrc ?? '',
                },
              } as const)
            : undefined
          const textMessage = {
            type: 'text',
            text: {
              body: `${idx + 1}. ${bodyText}`,
            },
          } as const
          return imageMessage ? [imageMessage, textMessage] : textMessage
        })
      }

      if (input.items.length > 3) {
        let bodyText = ''
        return [
          {
            type: 'interactive',
            interactive: {
              type: 'list',
              body: {
                text: lastMessageText ?? '...',
              },
              action: {
                button: 'Selecione uma Opção',
                sections: [
                  {
                    title: 'Lista',
                    rows: input.items.map((item) => {
                      let rowText = ''
                      if (item.title) rowText += `*${item.title}*`
                      if (item.description) {
                        if (item.title) rowText += '\n\n'
                        rowText += item.description
                      }
                      return {
                        id: item.id,
                        title: rowText,
                        description: ' ',
                      }
                    }),
                  },
                ],
              },
            },
          },
        ]
      } else {
        return input.items.map((item) => {
          let bodyText = ''
          if (item.title) bodyText += `*${item.title}*`
          if (item.description) {
            if (item.title) bodyText += '\n\n'
            bodyText += item.description
          }
          return {
            type: 'interactive',
            interactive: {
              type: 'button',
              header: item.pictureSrc
                ? {
                    type: 'image',
                    image: {
                      link: item.pictureSrc,
                    },
                  }
                : undefined,
              body: isEmpty(bodyText) ? undefined : { text: bodyText },
              action: {
                buttons: [
                  {
                    type: 'reply',
                    reply: {
                      id: item.id,
                      title: 'Select',
                    },
                  },
                ],
              },
            },
          }
        })
      }
    }

    case InputBlockType.CHOICE: {
      const items = input.items.filter((item) => isDefined(item.content))

      if (items.length <= 3) {
        return groupArrayByArraySize(
          items,
          env.WHATSAPP_INTERACTIVE_GROUP_SIZE
        ).map((group: ButtonItem[], idx: number) => ({
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: idx === 0 ? lastMessageText ?? '...' : '...',
            },
            action: {
              buttons: group.map((item: ButtonItem) => ({
                type: 'reply',
                reply: {
                  id: item.id,
                  title: trimTextTo20Chars(item.content as string),
                },
              })),
            },
          },
        }))
      } else {
        return [
          {
            type: 'interactive',
            interactive: {
              type: 'list',
              body: {
                text: lastMessageText ?? '...',
              },
              action: {
                button: 'Selecionar uma Opção',
                sections: [
                  {
                    title: 'Lista',
                    rows: items.map((item) => {
                      return {
                        id: item.id,
                        title: trimTextTo20Chars(item.content as string),
                        description: ' ',
                      }
                    }),
                  },
                ],
              },
            },
          },
        ]
      }
    }
  }
}

const trimTextTo20Chars = (text: string): string =>
  text.length > 20 ? `${text.slice(0, 18)}..` : text

const groupArrayByArraySize = <T>(arr: T[], n: number): T[][] =>
  arr.reduce((r: T[][], e: T, i: number) => {
    if (i % n) {
      r[r.length - 1].push(e)
    } else {
      r.push([e])
    }
    return r
  }, [])
