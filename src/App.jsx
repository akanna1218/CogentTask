import './App.css'
import TaskPage from './pages/TaskPage'
import { ThemeProvider } from '@mui/material/styles'
import theme from './app/theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <TaskPage />
    </ThemeProvider>
  )
}

export default App
