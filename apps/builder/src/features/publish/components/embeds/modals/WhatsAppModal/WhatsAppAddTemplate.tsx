import {
  Stack,
  Heading,
  Input,
  Flex,
  Box,
  Text,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react'
import { useState } from 'react'
import type React from 'react'
import { MoreInfoTooltip } from '@/components/MoreInfoTooltip'
import {
  ChevronLeftIcon,
  PlusIcon,
  ReplyIcon,
  ShareButtonIcon,
} from '@/components/icons'

export const WhatsAppAddTemplate = () => {
  const [formData, setFormData] = useState({
    templateName: '',
    language: '',
    category: '',
    header: '',
    body: '',
    footer: '',
  })

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }))
  }

  const formatInput = (value: string): string => {
    return value
      .toLowerCase() // Força minúsculas
      .replace(/[^a-z0-9_]/g, '') // Remove caracteres que não são letras minúsculas, números ou _
      .replace(/\s/g, '_') // Substitui espaços por _
  }

  return (
    <Stack spacing="10" w="full">
      <Heading fontSize="2xl">Novo Template</Heading>
      <Flex>
        <Box flex="2" pr="4">
          <small>{'(*) Campos obrigatórios'}</small>
          <FormControl>
            <FormControl>
              <Flex>
                <Box flex="2" mr="2" mt="2">
                  <FormLabel
                    display="flex"
                    flexShrink={0}
                    gap="1"
                    mr="0"
                    mb="2"
                  >
                    Nome do template *
                    <MoreInfoTooltip>
                      O nome não deve conter espaços, deve ser minúsculo e pode
                      ser separado por underline {"('_')"}.
                    </MoreInfoTooltip>
                  </FormLabel>
                  <Input
                    required
                    name="templateName"
                    value={formData.templateName}
                    onChange={(event) => {
                      const formattedValue = formatInput(event.target.value)
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        templateName: formattedValue,
                      }))
                    }}
                    placeholder="Nome do template"
                  />
                </Box>
                <Box flex="1" ml="2">
                  <FormLabel
                    display="flex"
                    flexShrink={0}
                    gap="1"
                    mr="0"
                    mb="2"
                    mt="2"
                  >
                    Idioma *
                  </FormLabel>
                  <Select
                    variant="outline"
                    placeholder="Escolha o Idioma"
                    color="black"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="option1">PT-BR</option>
                    <option value="option2">EN</option>
                  </Select>
                </Box>
              </Flex>
            </FormControl>

            <FormControl>
              <FormLabel
                display="flex"
                flexShrink={0}
                gap="1"
                mr="0"
                mb="2"
                mt="2"
              >
                Categoria *
              </FormLabel>
              <Select
                variant="outline"
                placeholder="Escolha a Categoria"
                color="black"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="option1">MARKETING</option>
                <option value="option2">UTILITY</option>
              </Select>
            </FormControl>

            <br />
            <Flex alignItems="center">
              <Text fontWeight="bold">Conteúdo</Text>
              <Box flex="1" height="1px" bg="gray.200" ml="2" />
            </Flex>

            <FormControl>
              <FormLabel
                display="flex"
                flexShrink={0}
                gap="1"
                mr="0"
                mb="2"
                mt="2"
              >
                Cabeçalho - Opcional
                <MoreInfoTooltip>
                  Crie um Cabeçalho com no máximo 60 caracteres.
                </MoreInfoTooltip>
              </FormLabel>
              <Input
                name="header"
                maxLength={60}
                placeholder="Cabeçalho"
                value={formData.header}
                onChange={handleInputChange}
              />

              <FormLabel
                display="flex"
                flexShrink={0}
                gap="1"
                mr="0"
                mb="2"
                mt="2"
              >
                Corpo *
                <MoreInfoTooltip>
                  {'Crie Variáveis usando tags {{1}}, {{2}} ...'}
                </MoreInfoTooltip>
              </FormLabel>
              <Textarea
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                required
                placeholder="Mensagem do Template"
              />

              <FormLabel
                display="flex"
                flexShrink={0}
                gap="1"
                mr="0"
                mb="2"
                mt="2"
              >
                Rodapé - Opcional
                <MoreInfoTooltip>
                  Crie um Rodapé com no máximo 60 caracteres.
                </MoreInfoTooltip>
              </FormLabel>
              <Input
                name="footer"
                maxLength={60}
                value={formData.footer}
                onChange={handleInputChange}
                placeholder="Rodapé"
              />
            </FormControl>

            <br />
            <Flex alignItems="center">
              <Text fontWeight="bold">Botões</Text>
              <Box flex="1" height="1px" bg="gray.200" ml="2" />
            </Flex>

            <Button as={Button} size="sm" leftIcon={<PlusIcon />}>
              Adicionar botão
            </Button>
            <Menu>
              <MenuButton
                as={IconButton}
                borderLeftRadius={0}
                icon={<ChevronLeftIcon transform="rotate(-90deg)" />}
                size="sm"
              />
              <MenuList>
                <MenuItem>Link</MenuItem>
              </MenuList>
            </Menu>
          </FormControl>
        </Box>
        <Box flex="1">
          <Box
            p="4"
            bg="white"
            boxShadow="md"
            color="black"
            position="relative"
            w="290px"
            h="500px"
            border="1px solid #ccc"
            borderRadius="20px"
            overflow="hidden"
            ml="auto"
          >
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              height="40px"
              bg="#08856F"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderBottom="1px solid #ccc"
              color={'white'}
            >
              <Text fontWeight="bold">WhatsApp</Text>
            </Box>
            <Box
              position="absolute"
              top="50px"
              left="10px"
              right="10px"
              bottom="10px"
              bg="#E5DDD5"
              borderRadius="10px"
              p="2"
              overflowY="auto"
            >
              <Box
                bg="#FFF"
                borderRadius="4px"
                p="2"
                maxWidth="90%"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '0',
                  left: '-10px',
                  width: '0',
                  height: '0',
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid #FFF',
                  borderTop: '10px solid #FFF',
                  borderBottom: '10px solid transparent',
                }}
              >
                <Text fontSize="sm" fontWeight="bold">
                  {formData.header || ''}
                </Text>
                <Text fontSize="sm" mt="2">
                  {formData.body.split('\n').map((line) => (
                    <Text
                      key={line + Math.random()}
                      fontSize="sm"
                      mt={formData.body.split('\n').indexOf(line) === 0 ? 0 : 2}
                    >
                      {line}
                    </Text>
                  )) ||
                    'Esta é uma mensagem de exemplo do template do WhatsApp.'}
                </Text>
                <Text fontSize="xs">{formData.footer || ''}</Text>
              </Box>
              <Box
                bg="#FFF"
                borderRadius="0 0 4px 4px"
                p="2"
                maxWidth="90%"
                borderTop="1px solid #ccc"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="#4C98C7"
              >
                <ShareButtonIcon fontSize="sm" />
                <Text fontSize="sm" ml="2">
                  Visit website
                </Text>
              </Box>
              <Box
                bg="#FFF"
                borderRadius="0 0 4px 4px"
                p="2"
                maxWidth="90%"
                mb="2"
                borderTop="1px solid #ccc"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="#4C98C7"
              >
                <ReplyIcon fontSize="sm" />
                <Text fontSize="sm" ml="2">
                  Quick Reply
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Stack>
  )
}
