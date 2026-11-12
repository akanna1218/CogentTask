import { create } from 'zustand'

const DEFAULT_LISTS = [{ id: 'my-tasks', title: 'My Tasks', tasks: [] }]

function getTaskKey(listId, taskId) {
  return JSON.stringify([listId, taskId])
}

function normalizeLists(lists) {
  return lists.map((list) => ({
    ...list,
    tasks: (Array.isArray(list.tasks) ? list.tasks : []).map((task) => ({
      ...task,
      details: task.details ?? '',
      dueDate: task.dueDate ?? '',
      completed: Boolean(task.completed),
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    })),
  }))
}

const useTaskStore = create((set) => ({
  lists: normalizeLists(DEFAULT_LISTS),
  taskOrder: [],
  selectedListId: DEFAULT_LISTS[0].id,
  initialized: false,

  initialize: (initialLists) => set((state) => {
    if (state.initialized) return state
    const lists = normalizeLists(
      Array.isArray(initialLists) && initialLists.length > 0 ? initialLists : DEFAULT_LISTS,
    )
    return {
      lists,
      taskOrder: lists.flatMap((list) => (
        list.tasks.map((task) => getTaskKey(list.id, task.id))
      )),
      selectedListId: lists[0].id,
      initialized: true,
    }
  }),

  selectList: (listId) => set((state) => (
    state.lists.some((list) => list.id === listId) ? { selectedListId: listId } : state
  )),

  saveTask: (listId, taskData, taskId) => set((state) => {
    const isNewTask = !taskId
    const resolvedTaskId = taskId ?? taskData.id
    const task = isNewTask
      ? { ...taskData, completed: false }
      : taskData
    const taskKey = getTaskKey(listId, resolvedTaskId)
    return {
      lists: state.lists.map((list) => {
        if (list.id !== listId) return list
        return {
          ...list,
          tasks: isNewTask
            ? [task, ...list.tasks]
            : list.tasks.map((currentTask) => (
              currentTask.id === taskId ? { ...currentTask, ...taskData } : currentTask
            )),
        }
      }),
      taskOrder: isNewTask
        ? [taskKey, ...state.taskOrder]
        : state.taskOrder.includes(taskKey) ? state.taskOrder : [...state.taskOrder, taskKey],
    }
  }),

  toggleTask: (listId, taskId) => set((state) => ({
    lists: state.lists.map((list) => list.id !== listId ? list : {
      ...list,
      tasks: list.tasks.map((task) => (
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )),
    }),
  })),

  deleteTask: (listId, taskId) => set((state) => ({
    lists: state.lists.map((list) => list.id !== listId ? list : {
      ...list,
      tasks: list.tasks.filter((task) => task.id !== taskId),
    }),
    taskOrder: state.taskOrder.filter((key) => key !== getTaskKey(listId, taskId)),
  })),

  toggleSubtask: (listId, taskId, subtaskId) => set((state) => ({
    lists: state.lists.map((list) => list.id !== listId ? list : {
      ...list,
      tasks: list.tasks.map((task) => task.id !== taskId ? task : {
        ...task,
        subtasks: task.subtasks.map((subtask) => (
          subtask.id === subtaskId
            ? { ...subtask, completed: !subtask.completed }
            : subtask
        )),
      }),
    }),
  })),

  addList: (list) => set((state) => ({
    lists: [...state.lists, list],
    selectedListId: list.id,
  })),

  deleteList: (listId) => set((state) => {
    if (state.lists.length < 2) return state
    const deletedTaskKeys = new Set(
      state.lists.find((list) => list.id === listId)?.tasks.map(
        (task) => getTaskKey(listId, task.id),
      ) ?? [],
    )
    const lists = state.lists.filter((list) => list.id !== listId)
    if (lists.length === state.lists.length) return state
    return {
      lists,
      taskOrder: state.taskOrder.filter((key) => !deletedTaskKeys.has(key)),
      selectedListId: state.selectedListId === listId ? lists[0].id : state.selectedListId,
    }
  }),

  reorderTasks: (orderedTasks) => set((state) => {
    const reorderedKeys = orderedTasks.map(({ listId, task }) => getTaskKey(listId, task.id))
    const reorderedKeySet = new Set(reorderedKeys)
    let nextKeyIndex = 0
    const taskOrder = state.taskOrder.map((key) => (
      reorderedKeySet.has(key) ? reorderedKeys[nextKeyIndex++] : key
    ))
    const orderByKey = new Map(taskOrder.map((key, index) => [key, index]))

    return {
      taskOrder,
      lists: state.lists.map((list) => ({
        ...list,
        tasks: [...list.tasks].sort((a, b) => (
          (orderByKey.get(getTaskKey(list.id, a.id)) ?? Number.MAX_SAFE_INTEGER)
          - (orderByKey.get(getTaskKey(list.id, b.id)) ?? Number.MAX_SAFE_INTEGER)
        )),
      })),
    }
  }),
}))

export default useTaskStore
