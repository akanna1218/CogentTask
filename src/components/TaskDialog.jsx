import { useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import CloseIcon from '@mui/icons-material/Close'
import createId from '../utils/createId'

export default function TaskDialog({ open, task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [details, setDetails] = useState(task?.details ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [subtasks, setSubtasks] = useState((task?.subtasks ?? []).map((subtask) => subtask.title).join('\n'))
  const dueDateInputRef = useRef(null)

  const submit = (event) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    onSave({
      title: cleanTitle,
      details: details.trim(),
      dueDate,
      subtasks: subtasks.split('\n').map((item) => item.trim()).filter(Boolean).map((text) => {
        const existing = task?.subtasks?.find((subtask) => subtask.title === text)
        return { id: existing?.id ?? createId(), title: text, completed: existing?.completed ?? false }
      }),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={submit}>
        <DialogTitle className="task-dialog-title">
          {task ? 'Edit task' : 'Add a task'}
          <IconButton aria-label="Close dialog" onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent className="task-dialog-content">
          <TextField
            autoFocus
            required
            fullWidth
            label="Task"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            inputProps={{ maxLength: 180 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
          <TextField
            fullWidth
            type="date"
            label="Due date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputRef={dueDateInputRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Choose due date"
                    edge="end"
                    onClick={() => {
                      const input = dueDateInputRef.current
                      if (typeof input?.showPicker === 'function') input.showPicker()
                      else input?.focus()
                    }}
                  >
                    <CalendarTodayOutlinedIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Subtasks"
            helperText="Add one subtask per line."
            value={subtasks}
            onChange={(event) => setSubtasks(event.target.value)}
          />
        </DialogContent>
        <DialogActions className="task-dialog-actions">
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={!title.trim()}>
            {task ? 'Save changes' : 'Add task'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
