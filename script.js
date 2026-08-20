(function () {
  "use strict";

  var STORAGE_KEY = "todo-list.tasks";

  var form = document.getElementById("task-form");
  var input = document.getElementById("task-input");
  var formError = document.getElementById("form-error");
  var list = document.getElementById("task-list");
  var counter = document.getElementById("counter");
  var emptyState = document.getElementById("empty-state");
  var clearDoneButton = document.getElementById("clear-done");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter"));

  var tasks = loadTasks();
  var activeFilter = "all";

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (item) {
          return item && typeof item.text === "string";
        })
        .map(function (item) {
          return {
            id: typeof item.id === "string" ? item.id : createId(),
            text: item.text,
            done: item.done === true
          };
        });
    } catch (error) {
      console.warn("تعذر قراءة المهام المحفوظة:", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.warn("تعذر حفظ المهام:", error);
    }
  }

  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function visibleTasks() {
    if (activeFilter === "active") {
      return tasks.filter(function (task) { return !task.done; });
    }
    if (activeFilter === "done") {
      return tasks.filter(function (task) { return task.done; });
    }
    return tasks;
  }

  function buildTaskElement(task) {
    var item = document.createElement("li");
    item.className = "task" + (task.done ? " is-done" : "");
    item.dataset.id = task.id;

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task__checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "تحديد المهمة كمكتملة");

    var text = document.createElement("span");
    text.className = "task__text";
    text.textContent = task.text;

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "task__delete";
    remove.textContent = "حذف";
    remove.setAttribute("aria-label", "حذف المهمة");

    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(remove);
    return item;
  }

  function render() {
    list.innerHTML = "";
    var shown = visibleTasks();
    shown.forEach(function (task) {
      list.appendChild(buildTaskElement(task));
    });

    var remaining = tasks.filter(function (task) { return !task.done; }).length;
    counter.textContent = remaining === 0
      ? "لا توجد مهام غير مكتملة"
      : "المهام غير المكتملة: " + remaining;

    if (tasks.length === 0) {
      emptyState.textContent = "لا توجد مهام حتى الآن. ابدأ بإضافة مهمة!";
      emptyState.hidden = false;
    } else if (shown.length === 0) {
      emptyState.textContent = "لا توجد مهام مطابقة لهذا التصفية.";
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
    }

    clearDoneButton.disabled = tasks.every(function (task) { return !task.done; });
  }

  function addTask(text) {
    tasks.unshift({ id: createId(), text: text, done: false });
    saveTasks();
    render();
  }

  function toggleTask(id) {
    tasks = tasks.map(function (task) {
      return task.id === id ? { id: task.id, text: task.text, done: !task.done } : task;
    });
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (task) { return task.id !== id; });
    saveTasks();
    render();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value.trim();
    if (!text) {
      formError.hidden = false;
      input.focus();
      return;
    }
    formError.hidden = true;
    addTask(text);
    input.value = "";
    input.focus();
  });

  input.addEventListener("input", function () {
    if (input.value.trim()) formError.hidden = true;
  });

  list.addEventListener("click", function (event) {
    var target = event.target;
    var item = target.closest(".task");
    if (!item) return;
    var id = item.dataset.id;

    if (target.classList.contains("task__delete")) {
      deleteTask(id);
    } else if (target.classList.contains("task__checkbox")) {
      toggleTask(id);
    }
  });

  clearDoneButton.addEventListener("click", function () {
    tasks = tasks.filter(function (task) { return !task.done; });
    saveTasks();
    render();
  });

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter;
      filterButtons.forEach(function (other) {
        other.classList.toggle("is-active", other === button);
      });
      render();
    });
  });

  var menuToggle = document.getElementById("menu-toggle");
  var menuClose = document.getElementById("menu-close");
  var sideMenu = document.getElementById("side-menu");
  var menuOverlay = document.getElementById("side-menu-overlay");
  var menuDownload = document.getElementById("menu-download");

  function openMenu() {
    sideMenu.classList.add("is-open");
    sideMenu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuOverlay.hidden = false;
    requestAnimationFrame(function () {
      menuOverlay.classList.add("is-open");
    });
  }

  function closeMenu() {
    sideMenu.classList.remove("is-open");
    sideMenu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    menuOverlay.classList.remove("is-open");
    setTimeout(function () {
      menuOverlay.hidden = true;
    }, 250);
  }

  menuToggle.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);
  menuOverlay.addEventListener("click", closeMenu);

  // داخل تطبيق الأندرويد (Cordova) مفيش داعي لزر "تحميل التطبيق" لأنه أصلاً متحمل.
  // زر "تواصل مع Obito" و"مزيد من منتجات Obito" بيفضلوا موجودين في القائمة الجانبية.
  if (window.cordova && menuDownload) {
    menuDownload.remove();
  }

  render();
})();

