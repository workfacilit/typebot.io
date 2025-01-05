import {
  Box,
  Button,
  chakra,
  HStack,
  Stack,
  Text,
  IconButton,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Image,
  useToast,
} from '@chakra-ui/react'
import { AlignLeftTextIcon, ChatIcon, UserIcon } from '@/components/icons'
import type {
  CellValueType,
  ResultHeaderCell,
  ResultsTablePreferences,
  TableData,
} from '@typebot.io/schemas'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { LoadingRows } from './LoadingRows'
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type Updater,
} from '@tanstack/react-table'
import { TableSettingsButton } from './TableSettingsButton'
import { useTypebot } from '@/features/editor/providers/TypebotProvider'
import { SelectionToolbar } from './SelectionToolbar'
import { Row } from './Row'
import { HeaderRow } from './HeaderRow'
import { IndeterminateCheckbox } from './IndeterminateCheckbox'
import { colors } from '@/lib/theme'
import { HeaderIcon } from '../HeaderIcon'
import { parseColumnsOrder } from '@typebot.io/results/parseColumnsOrder'
import { TimeFilterDropdown } from '@/features/analytics/components/TimeFilterDropdown'
import type { timeFilterValues } from '@/features/analytics/constants'
import { trpc } from '@/lib/trpc'

// 1) define new type to avoid "any"
type InteractiveListRowType = { id: string; title: string }

type ResultsTableProps = {
  resultHeader: ResultHeaderCell[]
  data: TableData[]
  hasMore?: boolean
  preferences?: ResultsTablePreferences
  timeFilter: (typeof timeFilterValues)[number]
  onTimeFilterChange: (timeFilter: (typeof timeFilterValues)[number]) => void
  onScrollToBottom: () => void
  onLogOpenIndex: (index: number) => () => void
  onResultExpandIndex: (index: number) => () => void
}

export const ResultsTable = ({
  resultHeader,
  data,
  hasMore,
  preferences,
  timeFilter,
  onTimeFilterChange,
  onScrollToBottom,
  onLogOpenIndex,
  onResultExpandIndex,
}: ResultsTableProps) => {
  // 2) store color mode values in variables (to avoid calling hooks in callbacks)
  const textColor = useColorModeValue('gray.800', 'gray.200')
  const background = useColorModeValue('white', colors.gray[900])
  const { updateTypebot, currentUserMode } = useTypebot()
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [isTableScrolled, setIsTableScrolled] = useState(false)
  const bottomElement = useRef<HTMLDivElement | null>(null)
  const tableWrapper = useRef<HTMLDivElement | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  type MessageType = {
    message: string | null
    direction: string
    timestamp: string
    id: number
    identifier?: string | null
    channel?: string | null
  }
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const drawerBodyRef = useRef<HTMLDivElement | null>(null)
  const toast = useToast()

  const handleIconButtonClick = (rowId: string) => {
    setSelectedRowId(rowId)
    setIsLoading(true)
  }

  const { data: fetchedMessages } = trpc.results.getMessages.useQuery(
    { resultId: selectedRowId || '' },
    { enabled: !!selectedRowId }
  )

  useEffect(() => {
    if (fetchedMessages && selectedRowId) {
      if (!fetchedMessages.messages?.length) {
        toast({ title: 'Não há mensagens nesse resultado.', status: 'info' })
        setSelectedRowId(null)
        setIsLoading(false)
      } else {
        setMessages(
          fetchedMessages.messages.map((message) => ({
            ...message,
            timestamp: message.timestamp.toISOString(),
          }))
        )
        setIsDrawerOpen(true)
        setIsLoading(false)
      }
    }
  }, [fetchedMessages, selectedRowId, toast])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!isLoading && drawerBodyRef.current) {
      drawerBodyRef.current.scrollTop = drawerBodyRef.current.scrollHeight
    }
  }, [isLoading, messages])

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedRowId(null)
    setMessages([])
  }

  // 3) remove duplicate props for <Text> and use the variables
  const renderMessageContent = (message: {
    message: string
    direction: string
    timestamp: string
    id: string
  }) => {
    if (/^[0-9]+$/.test(message.message.trim())) {
      return <Text>{message.message}</Text>
    }
    try {
      const parsedMessage = JSON.parse(message.message)
      if (parsedMessage.type === 'text') {
        return (
          <Text>
            {parsedMessage.text.body
              .split('\n')
              .map((line: string, index: number) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <React.Fragment key={index}>
                  {line.split('*').map((part: string, i: number) =>
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    i % 2 === 1 ? <b key={`${part}-${i}`}>{part}</b> : part
                  )}
                  <br />
                </React.Fragment>
              ))}
          </Text>
        )
      } else if (parsedMessage.type === 'interactive') {
        if (parsedMessage.interactive.type === 'list') {
          return (
            <Stack align="start" spacing={2}>
              <Text>
                {parsedMessage.interactive.body.text
                  .split('\n')
                  .map((line: string, index: number) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <React.Fragment key={index}>
                      {line.split('*').map((part: string, i: number) =>
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        i % 2 === 1 ? <b key={`${part}-${i}`}>{part}</b> : part
                      )}
                      <br />
                    </React.Fragment>
                  ))}
              </Text>
              {(
                parsedMessage.interactive.action.sections[0]
                  .rows as InteractiveListRowType[]
              ).map((row) => (
                <Button
                  id={row.id}
                  variant="outline"
                  colorScheme="gray"
                  key={row.id}
                  size="sm"
                  width="100%"
                  isActive={
                    messages[messages.indexOf(message) + 1]?.message === row.id
                  }
                >
                  <Text minW="8ch" color={textColor}>
                    {row.title}
                  </Text>
                </Button>
              ))}
            </Stack>
          )
        } else {
          return (
            <Stack align="start" spacing={2}>
              <Text>
                {parsedMessage.interactive.body.text
                  .split('\n')
                  .map((line: string, index: number) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <React.Fragment key={index}>
                      {line.split('*').map((part: string, i: number) =>
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        i % 2 === 1 ? <b key={`${part}-${i}`}>{part}</b> : part
                      )}
                      <br />
                    </React.Fragment>
                  ))}
              </Text>
              {parsedMessage.interactive.action.buttons.map(
                (button: { reply: { id: string; title: string } }) => (
                  <Button
                    id={button.reply.id}
                    variant="outline"
                    colorScheme="gray"
                    key={button.reply.id}
                    size="sm"
                    width="100%"
                    isActive={
                      messages[messages.indexOf(message) + 1]?.message ===
                      button.reply.id
                    }
                  >
                    <Text minW="8ch" color={textColor}>
                      {button.reply.title}
                    </Text>
                  </Button>
                )
              )}
            </Stack>
          )
        }
      } else if (parsedMessage.type === 'image') {
        return (
          <Box>
            <Image
              src={parsedMessage.image.link}
              alt="Image"
              boxSize="100px"
              objectFit="cover"
              cursor="pointer"
              onClick={() => window.open(parsedMessage.image.link, '_blank')}
            />
          </Box>
        )
      }
    } catch (e) {
      // If message is not JSON, check for previous interactive message
      const previousMessage = messages[messages.indexOf(message) - 1]
      if (previousMessage) {
        try {
          const parsedPreviousMessage = JSON.parse(previousMessage.message)
          if (parsedPreviousMessage.type === 'interactive') {
            if (parsedPreviousMessage.interactive.type === 'list') {
              const row =
                parsedPreviousMessage.interactive.action.sections[0].rows.find(
                  (r: { id: string }) => r.id === message.message
                )
              if (row) {
                return (
                  <Button
                    size="sm"
                    id={row.id}
                    variant="outline"
                    colorScheme="gray"
                    isActive={row.id === message.message}
                  >
                    {row.title}
                  </Button>
                )
              }
            } else {
              const button =
                parsedPreviousMessage.interactive.action.buttons.find(
                  (btn: { reply: { id: string } }) =>
                    btn.reply.id === message.message
                )
              if (button) {
                return (
                  <Button
                    size="sm"
                    id={button.reply.id}
                    variant="outline"
                    colorScheme="gray"
                    isActive={button.reply.id === message.message}
                  >
                    {button.reply.title}
                  </Button>
                )
              }
            }
          } else {
            return message.message.includes('https') ? (
              <Box>
                {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
                <audio controls>
                  <source src={message.message} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </Box>
            ) : (
              <Text>
                {message.message
                  .split('\n')
                  .map((line: string, index: number) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <React.Fragment key={index}>
                      {line.split('*').map((part: string, i: number) =>
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        i % 2 === 1 ? <b key={i}>{part}</b> : part
                      )}
                      <br />
                    </React.Fragment>
                  ))}
              </Text>
            )
          }
        } catch (e) {
          return message.message.includes('https') ? (
            <Box>
              {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
              <audio controls>
                <source src={message.message} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Box>
          ) : (
            <Text>
              {message.message
                .split('\n')
                .map((line: string, index: number) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  <React.Fragment key={index}>
                    {line
                      .split('*')
                      .map((part: string, i: number) =>
                        i % 2 === 1 ? <b key={i}>{part}</b> : part
                      )}
                    <br />
                  </React.Fragment>
                ))}
            </Text>
          )
        }
      }
      return message.message.includes('https') ? (
        <Box>
          {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
          <audio controls>
            <source src={message.message} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </Box>
      ) : (
        <Text>
          {message.message.split('\n').map((line: string, index: number) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <React.Fragment key={index}>
              {line
                .split('*')
                .map((part: string, i: number) =>
                  i % 2 === 1 ? <b key={i}>{part}</b> : part
                )}
              <br />
            </React.Fragment>
          ))}
        </Text>
      )
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const {
    columnsOrder,
    columnsVisibility = {},
    columnsWidth = {},
  } = {
    ...preferences,
    columnsOrder: parseColumnsOrder(preferences?.columnsOrder, resultHeader),
  }

  const changeColumnOrder = (newColumnOrder: string[]) => {
    if (typeof newColumnOrder === 'function') return
    updateTypebot({
      updates: {
        resultsTablePreferences: {
          columnsOrder: newColumnOrder,
          columnsVisibility,
          columnsWidth,
        },
      },
    })
  }

  const changeColumnVisibility = (
    newColumnVisibility: Record<string, boolean>
  ) => {
    if (typeof newColumnVisibility === 'function') return
    updateTypebot({
      updates: {
        resultsTablePreferences: {
          columnsVisibility: newColumnVisibility,
          columnsWidth,
          columnsOrder,
        },
      },
    })
  }

  const changeColumnSizing = (
    newColumnSizing: Updater<Record<string, number>>
  ) => {
    if (typeof newColumnSizing === 'object') return
    updateTypebot({
      updates: {
        resultsTablePreferences: {
          columnsWidth: newColumnSizing(columnsWidth),
          columnsVisibility,
          columnsOrder,
        },
      },
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  // 4) add missing dependency for "onResultExpandIndex"
  const columns = React.useMemo<ColumnDef<TableData>[]>(
    () => [
      {
        id: 'select',
        enableResizing: false,
        maxSize: 40,
        header: ({ table }) => (
          <IndeterminateCheckbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler(),
            }}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler(),
              }}
            />
          </div>
        ),
      },
      {
        id: 'message',
        enableResizing: false,
        maxSize: 60,
        header: () => (
          <HStack spacing={2} justifyContent="center">
            <ChatIcon />
          </HStack>
        ),
        cell: ({ row }) => (
          <HStack spacing={2}>
            <IconButton
              icon={<ChatIcon />}
              size="sm"
              aria-label={'chat'}
              onClick={() => handleIconButtonClick(row.id)}
            />
          </HStack>
        ),
      },
      ...resultHeader.map<ColumnDef<TableData>>((header) => ({
        id: header.id,
        accessorKey: header.id,
        size: 200,
        header: () => (
          <HStack overflow="hidden" data-testid={`${header.label} header`}>
            <HeaderIcon header={header} />
            <Text>{header.label}</Text>
          </HStack>
        ),
        cell: (info) => {
          const value = info?.getValue() as CellValueType | undefined
          if (!value) return
          return value.element || value.plainText || ''
        },
      })),
      {
        id: 'logs',
        enableResizing: false,
        maxSize: 200,
        header: () => (
          <HStack>
            <AlignLeftTextIcon />
            <Text>Mais Info.</Text>
          </HStack>
        ),
        cell: ({ row }) => (
          <HStack spacing={2}>
            <Button
              style={{ padding: '0 4px' }}
              size="sm"
              onClick={onLogOpenIndex(row.index)}
            >
              Logs
            </Button>
            <Button size="sm" onClick={onResultExpandIndex(row.index)}>
              Resultados
            </Button>
          </HStack>
        ),
      },
    ],
    [onLogOpenIndex, onResultExpandIndex, resultHeader] // added onResultExpandIndex here
  )

  const instance = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      columnVisibility: columnsVisibility,
      columnOrder: columnsOrder,
      columnSizing: columnsWidth,
    },
    getRowId: (row) => row.id.plainText,
    columnResizeMode: 'onChange',
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: changeColumnSizing,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleObserver = useCallback(
    (entities: IntersectionObserverEntry[]) => {
      const target = entities[0]
      if (target.isIntersecting) onScrollToBottom()
    },
    [onScrollToBottom]
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!bottomElement.current) return
    const options: IntersectionObserverInit = {
      root: tableWrapper.current,
      threshold: 0,
    }
    const observer = new IntersectionObserver(handleObserver, options)
    if (bottomElement.current) observer.observe(bottomElement.current)

    return () => {
      observer.disconnect()
    }
    // We need to rerun this effect when the bottomElement changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleObserver, bottomElement.current])

  return (
    <>
      <Stack maxW="1600px" px="4" overflowY="hidden" spacing={6}>
        <HStack w="full" justifyContent="flex-end">
          {currentUserMode === 'write' && (
            <SelectionToolbar
              selectedResultsId={Object.keys(rowSelection)}
              onClearSelection={() => setRowSelection({})}
            />
          )}
          <TimeFilterDropdown
            timeFilter={timeFilter}
            onTimeFilterChange={onTimeFilterChange}
            size="sm"
          />
          <TableSettingsButton
            resultHeader={resultHeader}
            columnVisibility={columnsVisibility}
            setColumnVisibility={changeColumnVisibility}
            columnOrder={columnsOrder}
            onColumnOrderChange={changeColumnOrder}
          />
        </HStack>
        <Box
          ref={tableWrapper}
          overflow="auto"
          rounded="md"
          data-testid="results-table"
          backgroundImage={`linear-gradient(to right, ${background}, ${background}), linear-gradient(to right, ${background}, ${background}),linear-gradient(to right, rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0)),linear-gradient(to left, rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0));`}
          backgroundPosition="left center, right center, left center, right center"
          backgroundRepeat="no-repeat"
          backgroundSize="30px 100%, 30px 100%, 15px 100%, 15px 100%"
          backgroundAttachment="local, local, scroll, scroll"
          onScroll={(e) =>
            setIsTableScrolled((e.target as HTMLElement).scrollTop > 0)
          }
        >
          <chakra.table rounded="md">
            <thead>
              {instance.getHeaderGroups().map((headerGroup) => (
                <HeaderRow
                  key={headerGroup.id}
                  headerGroup={headerGroup}
                  isTableScrolled={isTableScrolled}
                />
              ))}
            </thead>

            <tbody>
              {instance.getRowModel().rows.map((row, rowIndex) => (
                <Row
                  row={row}
                  key={row.id}
                  bottomElement={
                    rowIndex === data.length - 10 ? bottomElement : undefined
                  }
                  onExpandButtonClick={() => handleIconButtonClick(row.id)}
                  isSelected={row.getIsSelected()}
                />
              ))}
              {hasMore === true && (
                <LoadingRows
                  totalColumns={
                    resultHeader.filter(
                      (header) => columnsVisibility[header.id] !== false
                    ).length + 1
                  }
                />
              )}
            </tbody>
          </chakra.table>
        </Box>
      </Stack>
      <Drawer
        size={'md'}
        isOpen={isDrawerOpen}
        placement="right"
        onClose={handleCloseDrawer}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <HStack spacing={2} align="center">
              <UserIcon />
              <Text>{messages[0] ? messages[0].identifier : ''}</Text>
            </HStack>
            <small style={{ fontSize: '11px' }}>Canal: </small>
            <small style={{ fontSize: '11px' }}>
              {messages[0]
                ? messages[0].channel.charAt(0).toUpperCase() +
                  messages[0].channel.slice(1)
                : ''}
            </small>
            {' | '}
            <small style={{ fontSize: '11px' }}>Protocolo: </small>
            <small style={{ fontSize: '11px' }}>{selectedRowId}</small>
          </DrawerHeader>
          <DrawerBody ref={drawerBodyRef}>
            {isLoading ? (
              <Text>Loading...</Text>
            ) : (
              selectedRowId && (
                <Stack spacing={4}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      alignSelf={
                        message.direction === 'outbound'
                          ? 'flex-start'
                          : 'flex-end'
                      }
                      bg={
                        message.direction === 'outbound'
                          ? 'gray.100'
                          : 'blue.300'
                      }
                      color={
                        message.direction === 'outbound' ? 'black' : 'white'
                      }
                      px={4}
                      py={2}
                      borderRadius="md"
                      maxW="80%"
                    >
                      {renderMessageContent(message)}
                      <Text
                        textAlign={
                          message.direction === 'outbound' ? 'left' : 'right'
                        }
                        fontSize="xs"
                        mt={2}
                      >
                        {formatTimestamp(message.timestamp)}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              )
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
