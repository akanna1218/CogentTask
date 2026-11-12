import { Box, Button, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'

export default function TaskSidebar({
  title,
  lists,
  selectedList,
  isDueItemsActive,
  onAddTask,
  onSelectDueItems,
  onSelectList,
  onCreateList,
}) {
  const remainingTaskCount = lists.reduce(
    (count, list) => count + list.tasks.filter((task) => !task.completed).length,
    0,
  )

  return (
    <Box className="task-manager-sidebar">
      <Box className="task-brand">
        <CheckCircleIcon />
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Button className="task-add-button" variant="contained" startIcon={<AddIcon />} onClick={onAddTask}>
        Add a task
      </Button>
      <Box className="task-list-nav task-views-nav" component="nav" aria-label="Task views">
        <button
          className={`task-list-link${isDueItemsActive ? ' active' : ''}`}
          type="button"
          onClick={onSelectDueItems}
        >
          <CheckCircleOutlineIcon fontSize="small" />
          <span>Due items</span>
          <small>{remainingTaskCount}</small>
        </button>
      </Box>
      <Typography className="task-sidebar-label" variant="overline">My lists</Typography>
      <Box className="task-list-nav" component="nav" aria-label="Task lists">
        {lists.map((list) => (
          <button
            className={`task-list-link${!isDueItemsActive && list.id === selectedList?.id ? ' active' : ''}`}
            key={list.id}
            type="button"
            onClick={() => onSelectList(list.id)}
          >
            <FormatListBulletedIcon fontSize="small" />
            <span>{list.title}</span>
            <small>{list.tasks.filter((task) => !task.completed).length}</small>
          </button>
        ))}
        <button className="task-list-link task-new-list" type="button" onClick={onCreateList}>
          <AddIcon fontSize="small" /><span>Create new list</span>
        </button>
      </Box>
    </Box>
  )
}
