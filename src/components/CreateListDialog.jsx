import { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'

export default function CreateListDialog({ open, onClose, onCreate }) {
  const [listTitle, setListTitle] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const cleanTitle = listTitle.trim()
    if (!cleanTitle) return
    onCreate(cleanTitle)
    setListTitle('')
  }

  const close = () => {
    setListTitle('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={submit}>
        <DialogTitle>Create a list</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            required
            fullWidth
            label="List name"
            value={listTitle}
            onChange={(event) => setListTitle(event.target.value)}
            inputProps={{ maxLength: 60 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={!listTitle.trim()}>Create</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
