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
import React from 'react'
import { MoreInfoTooltip } from '@/components/MoreInfoTooltip'
import { ChevronLeftIcon, PlusIcon } from '@/components/icons'

export const WhatsAppAddTemplate = () => {
  return (
    <Stack spacing="10" w="full">
      <Heading fontSize="2xl">Novo Template</Heading>
      <Flex>
        <Box flex="2" pr="4">
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
                    Nome do template
                    <MoreInfoTooltip>
                      O nome não deve conter espaços, deve ser minúsculo e pode
                      ser separado por hífen.
                    </MoreInfoTooltip>
                  </FormLabel>
                  <Input required placeholder="Nome do template" />
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
                    Idioma
                  </FormLabel>
                  <Select
                    variant="outline"
                    placeholder="Escolha o Idioma"
                    color="black"
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
                Categoria
              </FormLabel>
              <Select
                variant="outline"
                placeholder="Escolha a Categoria"
                color="black"
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
                placeholder="Nome do template"
              />

              <FormLabel
                display="flex"
                flexShrink={0}
                gap="1"
                mr="0"
                mb="2"
                mt="2"
              >
                Corpo
                <MoreInfoTooltip>
                  {'Crie Variáveis usando tags {{1}}, {{2}} ...'}
                </MoreInfoTooltip>
              </FormLabel>
              <Textarea required placeholder="Here is a sample placeholder" />

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
                name="header"
                maxLength={60}
                placeholder="Nome do template"
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
              bg="gray.200"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderBottom="1px solid #ccc"
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
                  {'Cabeçalho'}
                </Text>
                <Text fontSize="sm" mt="2">
                  Esta é uma mensagem de exemplo do template do WhatsApp.
                </Text>
                <Text fontSize="xs">Rodapé.</Text>
              </Box>
              <Box
                bg="#FFF"
                borderRadius="0 0 4px 4px"
                p="2"
                maxWidth="90%"
                mb="2"
                borderTop="1px solid #ccc"
              ></Box>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Stack>
  )
}
