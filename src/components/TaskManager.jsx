import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import DraggableList from './DraggableList'
import CreateListDialog from './CreateListDialog'
import TaskDialog from './TaskDialog'
import TaskSidebar from './TaskSidebar'
import useTaskStore from '../store/taskStore'
import createId from '../utils/createId'
import './TaskManager.css'

const DEFAULT_LISTS = [{ id: 'my-tasks', title: 'My Tasks', tasks: [] }]

function getTaskKey(listId, taskId) {
  return JSON.stringify([listId, taskId])
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDueDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`))
}

function TaskRow({ task, onToggle, onEdit, onDelete, onToggleSubtask }) {
  const [expanded, setExpanded] = useState(false)
  const hasExtras = Boolean(task.details || task.subtasks?.length)
  const isOverdue = task.dueDate && !task.completed && task.dueDate < getLocalDateString()

  return (
    <Box className={`task-row${task.completed ? ' is-completed' : ''}`}>
      <Checkbox
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        icon={<CheckCircleOutlineIcon />}
        checkedIcon={<CheckCircleOutlineIcon />}
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
        className="task-completion"
      />
      <Box className="task-row-main">
        <button className="task-title-button" type="button" onClick={() => hasExtras && setExpanded(!expanded)}>
          <span className="task-title">{task.title}</span>
          {hasExtras && (expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
        </button>
        {task.dueDate && (
          <Typography className={`task-due-date${isOverdue ? ' overdue' : ''}`} variant="caption">
            <CalendarTodayOutlinedIcon fontSize="inherit" /> {formatDueDate(task.dueDate)}
          </Typography>
        )}
        {expanded && (
          <Box className="task-extra">
            {task.details && <Typography variant="body2">{task.details}</Typography>}
            {task.subtasks?.map((subtask) => (
              <Box className="task-subtask" key={subtask.id}>
                <Checkbox
                  size="small"
                  checked={subtask.completed}
                  onChange={() => onToggleSubtask(task.id, subtask.id)}
                  aria-label={subtask.completed ? `Mark ${subtask.title} incomplete` : `Complete ${subtask.title}`}
                />
                <Typography className={subtask.completed ? 'subtask-completed' : ''} variant="body2">{subtask.title}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <Box className="task-row-actions">
        <Tooltip title="Edit task"><IconButton aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)} size="small"><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete task"><IconButton aria-label={`Delete ${task.title}`} onClick={() => onDelete(task.id)} size="small"><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    </Box>
  )
}

export default function TaskManager({
  initialLists = DEFAULT_LISTS,
  title = 'Tasks',
}) {
  const lists = useTaskStore((state) => state.lists)
  const taskOrder = useTaskStore((state) => state.taskOrder)
  const selectedListId = useTaskStore((state) => state.selectedListId)
  const initialize = useTaskStore((state) => state.initialize)
  const selectList = useTaskStore((state) => state.selectList)
  const addOrUpdateTask = useTaskStore((state) => state.saveTask)
  const toggleTask = useTaskStore((state) => state.toggleTask)
  const deleteTask = useTaskStore((state) => state.deleteTask)
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask)
  const addListToStore = useTaskStore((state) => state.addList)
  const deleteListFromStore = useTaskStore((state) => state.deleteList)
  const reorderTasks = useTaskStore((state) => state.reorderTasks)
  const [search, setSearch] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editingListId, setEditingListId] = useState(null)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [isDueItemsActive, setIsDueItemsActive] = useState(false)

  useEffect(() => {
    initialize(initialLists)
  }, [initialize, initialLists])

  const selectedList = lists.find((list) => list.id === selectedListId) ?? lists[0]
  const visibleTasks = useMemo(() => {
    if (!selectedList) return []
    const query = search.trim().toLocaleLowerCase()
    const orderByKey = new Map(taskOrder.map((key, index) => [key, index]))
    const taskEntries = isDueItemsActive
      ? lists.flatMap((list) => list.tasks.map((task) => ({ task, listId: list.id })))
      : selectedList.tasks.map((task) => ({ task, listId: selectedList.id }))

    return taskEntries
      .filter(({ task }) => isDueItemsActive ? !task.completed : (showCompleted || !task.completed))
      .filter(({ task }) => !query || [task.title, task.details, ...task.subtasks.map((item) => item.title)]
        .some((value) => value?.toLocaleLowerCase().includes(query)))
      .sort((a, b) => (
        (orderByKey.get(getTaskKey(a.listId, a.task.id)) ?? Number.MAX_SAFE_INTEGER)
        - (orderByKey.get(getTaskKey(b.listId, b.task.id)) ?? Number.MAX_SAFE_INTEGER)
      ))
  }, [lists, selectedList, search, showCompleted, isDueItemsActive, taskOrder])

  const remainingTaskCount = (isDueItemsActive ? lists.flatMap((list) => list.tasks) : selectedList?.tasks ?? [])
    .filter((task) => !task.completed).length

  const saveTask = (taskData) => {
    const targetListId = editingListId ?? selectedList?.id
    if (!targetListId) return
    addOrUpdateTask(
      targetListId,
      editingTask ? taskData : { ...taskData, id: createId() },
      editingTask?.id,
    )
    setDialogOpen(false)
    setEditingTask(null)
    setEditingListId(null)
  }

  const handleToggleTask = (listId, taskId) => toggleTask(listId, taskId)
  const handleDeleteTask = (listId, taskId) => deleteTask(listId, taskId)
  const handleToggleSubtask = (listId, taskId, subtaskId) => (
    toggleSubtask(listId, taskId, subtaskId)
  )

  const handleEditTask = (task, listId) => {
    setEditingTask(task)
    setEditingListId(listId)
    setDialogOpen(true)
  }

  const addList = (listTitle) => {
    const list = { id: createId(), title: listTitle, tasks: [] }
    addListToStore(list)
    setIsDueItemsActive(false)
    setListDialogOpen(false)
  }

  const deleteSelectedList = () => {
    if (!selectedList || lists.length < 2) return
    deleteListFromStore(selectedList.id)
  }

  return (
    <Box className="task-manager">
      <TaskSidebar
        title={title}
        lists={lists}
        selectedList={selectedList}
        isDueItemsActive={isDueItemsActive}
        onAddTask={() => {
          setEditingTask(null)
          setEditingListId(null)
          setDialogOpen(true)
        }}
        onSelectDueItems={() => setIsDueItemsActive(true)}
        onSelectList={(listId) => {
          selectList(listId)
          setIsDueItemsActive(false)
        }}
        onCreateList={() => setListDialogOpen(true)}
      />

      <Box className="task-manager-content">
        <Box className="task-content-heading">
          <Box>
            <Typography className="task-eyebrow" variant="overline">YOUR TO-DO LIST</Typography>
            <Typography component="h1" variant="h4">
              {isDueItemsActive ? 'Due items' : selectedList?.title ?? 'Tasks'}
            </Typography>
          </Box>
          <Box className="task-header-actions">
            <TextField
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks"
              InputProps={{ startAdornment: <SearchIcon fontSize="small" /> }}
              inputProps={{ 'aria-label': 'Search tasks' }}
            />
            {lists.length > 1 && !isDueItemsActive && (
              <Tooltip title="Delete this list">
                <IconButton aria-label={`Delete ${selectedList?.title}`} onClick={deleteSelectedList}><DeleteOutlineIcon /></IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box className="task-list">
          {visibleTasks.length > 0 ? (
            <DraggableList
              key={`${isDueItemsActive ? 'due-items' : selectedListId}:${search}:${showCompleted}`}
              items={visibleTasks}
              getItemKey={({ listId, task }) => getTaskKey(listId, task.id)}
              onReorder={reorderTasks}
              renderItem={({ task, listId }) => (
                <TaskRow
                  task={task}
                  onToggle={(taskId) => handleToggleTask(listId, taskId)}
                  onEdit={(taskToEdit) => handleEditTask(taskToEdit, listId)}
                  onDelete={(taskId) => handleDeleteTask(listId, taskId)}
                  onToggleSubtask={(taskId, subtaskId) => handleToggleSubtask(listId, taskId, subtaskId)}
                />
              )}
            />
          ) : (
            <Box className="task-empty">
              <CheckCircleOutlineIcon />
              <Typography variant="h6">
                {search ? 'No matching tasks' : isDueItemsActive ? 'No due items' : 'Nothing on your list'}
              </Typography>
              <Typography variant="body2">
                {search ? 'Try another search.' : isDueItemsActive ? 'All your tasks are checked off.' : 'Add a task and make a little progress.'}
              </Typography>
            </Box>
          )}
        </Box>

        <Box className="task-footer">
          <Typography variant="caption">{remainingTaskCount} tasks left</Typography>
          {!isDueItemsActive && (
            <Button size="small" color="inherit" onClick={() => setShowCompleted((current) => !current)}>
              {showCompleted ? 'Hide completed' : 'Show completed'}
            </Button>
          )}
        </Box>
      </Box>

      {dialogOpen && (
        <TaskDialog
          key={editingTask?.id ?? 'new-task'}
          open={dialogOpen}
          task={editingTask}
          onClose={() => { setDialogOpen(false); setEditingTask(null); setEditingListId(null) }}
          onSave={saveTask}
        />
      )}
      <CreateListDialog
        open={listDialogOpen}
        onClose={() => setListDialogOpen(false)}
        onCreate={addList}
      />
    </Box>
  )
}
