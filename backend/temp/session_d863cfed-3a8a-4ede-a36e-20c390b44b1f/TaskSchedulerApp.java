import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

/**
 * COMPLEX SINGLE-FILE JAVA PROGRAM
 * --------------------------------
 * Task Scheduler with priority, multithreading,
 * observer notifications, and file persistence.
 */
public class TaskSchedulerApp {

    /* ===================== MAIN ===================== */
    public static void main(String[] args) {
        TaskScheduler scheduler = TaskScheduler.getInstance();
        scheduler.addListener(new LoggingListener());

        List<String> tasks = List.of(
                "Backup", "Cleanup", "Email Sync",
                "Security Scan", "Report Generation"
        );

        Random random = new Random();

        tasks.stream()
                .map(name -> new Task(name, random.nextInt(10) + 1))
                .forEach(scheduler::submitTask);
    }

    /* ===================== TASK ===================== */
    static class Task implements Comparable<Task> {
        private final String id = UUID.randomUUID().toString();
        private final String name;
        private final int priority;
        private final LocalDateTime createdAt = LocalDateTime.now();

        Task(String name, int priority) {
            this.name = name;
            this.priority = priority;
        }

        @Override
        public int compareTo(Task o) {
            return Integer.compare(o.priority, this.priority); // higher first
        }

        @Override
        public String toString() {
            return name + " | priority=" + priority + " | created=" + createdAt;
        }
    }

    /* ===================== OBSERVER ===================== */
    interface TaskListener {
        void onTaskCompleted(Task task);
    }

    static class LoggingListener implements TaskListener {
        @Override
        public void onTaskCompleted(Task task) {
            System.out.println("✔ Completed: " + task.name);
        }
    }

    /* ===================== SCHEDULER (SINGLETON) ===================== */
    static class TaskScheduler {

        private static final TaskScheduler INSTANCE = new TaskScheduler();

        private final PriorityBlockingQueue<Task> queue =
                new PriorityBlockingQueue<>();

        private final ExecutorService pool =
                Executors.newFixedThreadPool(3);

        private final List<TaskListener> listeners =
                new CopyOnWriteArrayList<>();

        private TaskScheduler() {
            startDispatcher();
        }

        public static TaskScheduler getInstance() {
            return INSTANCE;
        }

        public void submitTask(Task task) {
            queue.add(task);
        }

        public void addListener(TaskListener listener) {
            listeners.add(listener);
        }

        private void startDispatcher() {
            Thread dispatcher = new Thread(() -> {
                while (true) {
                    try {
                        Task task = queue.take();
                        pool.submit(() -> execute(task));
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }, "Dispatcher-Thread");
            dispatcher.setDaemon(true);
            dispatcher.start();
        }

        private void execute(Task task) {
            try {
                System.out.println("Executing: " + task);
                Thread.sleep(1000); // simulate work
                notifyListeners(task);
                persist(task);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        private void notifyListeners(Task task) {
            listeners.forEach(l -> l.onTaskCompleted(task));
        }

        private synchronized void persist(Task task) {
            try (FileWriter fw = new FileWriter("completed_tasks.txt", true)) {
                fw.write(task + System.lineSeparator());
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
