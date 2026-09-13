import { PlusIcon, SearchIcon, XCircleFillIcon } from '@primer/octicons-react'
import { Button, FormControl, Stack, TextInput } from '@primer/react'
import { ChangeEvent } from 'react'
import styles from './search.module.css'

interface SearchWithCreateProps {
  placeholder: string
  createButtonLabel: string
  searchValue: string
  setSearchValue: (value: string) => void
  openCreateDialog: () => void
}

export const SearchWithCreate = ({
  placeholder,
  createButtonLabel,
  searchValue,
  setSearchValue,
  openCreateDialog,
}: SearchWithCreateProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }

  return (
    <div className={styles.wrapper}>
      <Stack align="center" direction="horizontal">
        <Stack.Item grow={true}>
          <FormControl>
            <FormControl.Label visuallyHidden>Search</FormControl.Label>
            <TextInput
              onChange={handleChange}
              value={searchValue}
              leadingVisual={SearchIcon}
              placeholder={placeholder}
              size="large"
              block
              trailingAction={
                <TextInput.Action
                  onClick={() => {
                    setSearchValue('')
                  }}
                  icon={XCircleFillIcon}
                  aria-label="Clear input"
                  className={styles.clearAction}
                />
              }
            />
          </FormControl>
        </Stack.Item>
        <Stack.Item>
          <Button
            leadingVisual={PlusIcon}
            size="large"
            variant="primary"
            onClick={openCreateDialog}
          >
            {createButtonLabel}
          </Button>
        </Stack.Item>
      </Stack>
    </div>
  )
}
