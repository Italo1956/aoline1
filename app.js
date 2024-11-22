// Selección de elementos del DOM
const taskName = document.getElementById('taskName');
const taskDescription = document.getElementById('taskDescription');
const taskDate = document.getElementById('taskDate');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Función para obtener tareas desde localStorage
function getTasks() {
  const tasks = /*localStorage.getItem('tasks')*/main_page_products;
  return tasks ? JSON.parse(tasks) : [];
}

// Función para guardar tareas en localStorage
function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Función para agregar una tarea
function addTask(task) {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
  renderTasks();
}

// Función para eliminar una tarea
function removeTask(index) {
  const tasks = getTasks();
  tasks.splice(index, 1); // Elimina la tarea por índice
  saveTasks(tasks);
  renderTasks();
}

// Función para alternar el estado de completada
function toggleTaskCompletion(index) {
  const tasks = getTasks();
  tasks[index].completada = !tasks[index].completada; // Alternar estado
  saveTasks(tasks);
  renderTasks();
}

// Función para renderizar las tareas en el DOM
function renderTasks() {
  const tasks = getTasks();
  taskList.innerHTML = ''; // Limpiar la lista antes de renderizar
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.classList.toggle('task-completed', task.completada); // Clase para completadas
    li.innerHTML = `
      <strong>${task.nombre}</strong>
      <p>${task.descripcion}</p>
      <small>Fecha: ${task.fecha}</small>
      <button onclick="toggleTaskCompletion(${index})">
        ${task.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
      </button>
      <span onclick="removeTask(${index})">❌ Eliminar</span>
    `;
    taskList.appendChild(li);
  });
}

// Agregar tarea cuando se hace clic en el botón
addTaskBtn.addEventListener('click', () => {
  const name = taskName.value.trim();
  const description = taskDescription.value.trim();
  const date = taskDate.value;
  if (name && description && date) {
    const task = { nombre: name, descripcion: description, fecha: date, completada: false };
    addTask(task);
    taskName.value = '';
    taskDescription.value = '';
    taskDate.value = '';
  }
});

// Renderizar tareas al cargar la página
renderTasks();
