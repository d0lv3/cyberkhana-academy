import { answerMask as shapeOfAnswer } from '../backend/src/shared/checks';

/* A question is asked one of two ways. 'mcq' offers options to pick from;
 * 'text' asks for the answer to be typed out. `kind` is optional because the
 * several hundred literals below, and every quiz a creator has already saved,
 * predate it: absent means 'mcq', so nothing needs migrating. */
export type QuizKind = 'mcq' | 'text';

/** A question as authored, answer included: what the studio edits and the
 *  server stores and marks against. Students are never sent one. */
export type QuizQuestion = {
  question: string;
  kind?: QuizKind;
  /** Multiple choice only. A typed question carries an empty list. */
  options: string[];
  /** Multiple choice only: index into `options`. */
  correctIndex: number;
  /** Typed questions only: the answer the learner writes out. */
  answer?: string;
};

/**
 * A question as a lesson shows it. The answer stays on the server, which
 * marks each one (backend/src/shared/checks.ts) and takes the answers out of
 * everything it sends students (backend/src/utils/redact.ts); a typed question
 * arrives with the shape of its answer instead.
 *
 * The answer fields are here only because a creator looking at their own work,
 * or previewing a draft, is holding the authored copy.
 */
export type StudentQuizQuestion = {
  question: string;
  kind?: QuizKind;
  options: string[];
  /** Typed questions only: the answer's shape in asterisks. */
  mask?: string;
  correctIndex?: number;
  answer?: string;
};

export type LessonQuiz = StudentQuizQuestion[];

export const isTextQuestion = (q: { kind?: QuizKind }): boolean => q.kind === 'text';

/** The shape of a typed answer, one asterisk per character with the spaces
 *  left standing, shown in the empty box so a stuck learner can still see how
 *  long the answer runs and how many words it is. The server sends it ready
 *  made; an authored copy works it out from the answer. */
export const answerMask = (q: { mask?: string; answer?: string }): string =>
  q.mask ?? shapeOfAnswer(q.answer ?? '');

/* Built-in quizzes, keyed by lecture ID. The right answers are kept apart, in
   data/linuxQuizAnswers.ts, which only the server's copy is made from. */
const quizzes: Record<string, LessonQuiz> = {
  // Module 2: The Linux Terminal
  '2.1': [
    { question: 'What does GUI stand for?', options: ['Graphical Universe Interface', 'Graphical Unified Interface', 'Graphical User Interface'] },
    { question: 'What does CLI stand for?', options: ['Command Line Interface', 'Command Layout Interface', 'Command Light Interface'] },
    { question: "What is the purpose of the 'echo' command?", options: ['Print the contents of a file', 'Delete a file', 'Print the text that follows it'] },
    { question: "What does the 'whoami' command display?", options: ['Current directory listing', 'Your username', 'System uptime'] },
  ],
  '2.2': [
    { question: 'What type of data is stored in /etc?', options: ['User home directories', 'System configuration files', 'Temporary files'] },
    { question: 'What is the /home directory used for?', options: ['System binaries', 'Personal user files', 'Log files'] },
    { question: 'What kind of data does /var typically contain?', options: ['Variable data such as logs', 'User home directories', 'Kernel source code'] },
    { question: "What does the 'pwd' command display?", options: ['Current working directory', 'Available disk space', 'Running processes'] },
    { question: "What is the function of the 'ls' command?", options: ['Change directory', 'List directory contents', 'Create new files'] },
    { question: "What does the 'cd' command do?", options: ['Change directory', 'Copy files', 'Delete files'] },
  ],
  '2.3': [
    { question: "What does the 'touch' command create?", options: ['An empty file', 'A new directory', 'A symbolic link'] },
    { question: "What is the purpose of 'mkdir'?", options: ['Move files', 'Create a new directory', 'Delete a directory'] },
    { question: "What does the 'cp' command do?", options: ['Copy files or directories', 'Change file permissions', 'Compress files'] },
    { question: "What does 'mv' do?", options: ['Move or rename files', 'Display running processes', 'Delete files'] },
    { question: "What is the function of 'rm'?", options: ['Remove files or directories', 'Rename files', 'Read a file'] },
    { question: "What does 'cat' do?", options: ['Display file contents only', 'Concatenate files only', 'Both display and concatenate files'] },
    { question: "What does the 'tree' command show?", options: ['Directory structure in tree format', "A file's permissions", 'Process hierarchy'] },
    { question: "What does the 'man' command provide?", options: ['Manual pages for commands', 'System logs', 'File sizes'] },
  ],
  '2.4': [
    { question: 'What does tab completion do in the terminal?', options: ['Automatically completes commands or filenames', 'Opens a text editor', 'Shows command history'] },
    { question: "What is 'nano' used for?", options: ['Editing text files', 'Viewing logs', 'Compiling code'] },
    { question: 'What does the pipe operator (|) do?', options: ['Redirect output of one command to another', 'Run commands in parallel', 'Save output to a file'] },
    { question: "What is 'grep' used for?", options: ['Searching for patterns in text', 'Displaying system status', 'Compressing files'] },
    { question: 'What does the output redirection operator (>) do?', options: ['Send output to a file', 'Display output in reverse', 'Send output to another machine'] },
    { question: "What does chaining commands with '&&' do?", options: ['Run the second command only if the first succeeds', 'Run the second command only if the first fails', 'Run both commands simultaneously'] },
  ],

  // Module 3: Users, Permissions & Root Access
  '3.1': [
    { question: 'What are users in Linux?', options: ['Accounts that can log in and run programs', 'Files on the system', 'Groups of commands'] },
    { question: 'What are groups in Linux?', options: ['Collections of users', 'Individual files', 'Running processes'] },
    { question: 'Which command adds a new user?', options: ['useradd', 'usermod', 'groups', 'passwd'] },
    { question: 'Which command modifies an existing user?', options: ['usermod', 'userdel', 'id', 'groups'] },
    { question: 'Which command deletes a user account?', options: ['usermod', 'userdel', 'passwd', 'useradd'] },
    { question: "Which command displays a user's ID and group information?", options: ['id', 'groups', 'useradd', 'userdel'] },
  ],
  '3.2': [
    { question: "What does 'chmod' do?", options: ['Change file permissions', 'Change file ownership', 'List files', 'Delete files'] },
    { question: "What does 'chown' do?", options: ['Change file ownership', 'Change file permissions', 'Show file contents', 'Move files'] },
    { question: "What information does 'ls -l' display?", options: ['Detailed file info including permissions and owner', 'Only file names', 'Only directories', 'Running processes'] },
    { question: 'What are the three types of file permissions in Linux?', options: ['Read, Write, Execute', 'Start, Stop, Pause', 'Create, Delete, Modify'] },
    { question: 'Which permission categories apply to a file?', options: ['Owner, Group, Others', 'Root only', 'All users equally'] },
    { question: 'How do you give execute permission to a file?', options: ['chmod +x filename', 'chmod -x filename', 'chown user filename'] },
  ],
  '3.3': [
    { question: 'What is the root user in Linux?', options: ['The superuser with full system access', 'A normal user', 'A group of users'] },
    { question: "What does 'sudo' do?", options: ['Run a command as root or another user', 'Delete files', 'Show system info'] },
    { question: "Why use 'sudo' instead of logging in as root?", options: ['For safety and controlled access', 'Because root is slower', 'To list files faster'] },
    { question: 'Which file controls sudo access?', options: ['/etc/sudoers', '/etc/passwd', '/etc/group', '/etc/shadow'] },
  ],

  // Module 4: Package & Tool Management
  '4.1': [
    { question: "What does 'apt update' do?", options: ['Update the package index', 'Install new packages', 'Remove packages'] },
    { question: "What does 'apt upgrade' do?", options: ['Upgrade installed packages', 'Install new packages', 'Remove packages'] },
    { question: 'How do you install a package using APT?', options: ['apt install package_name', 'apt remove package_name', 'apt update'] },
    { question: 'How do you remove a package using APT?', options: ['apt remove package_name', 'apt install package_name', 'apt upgrade'] },
  ],
  '4.2': [
    { question: "What is 'dpkg' used for?", options: ['Install or manage .deb packages directly', 'Upgrade all packages', 'Update the package index'] },
    { question: 'How do you install a .deb package with dpkg?', options: ['dpkg -i package.deb', 'apt install package.deb', 'dpkg -r package.deb'] },
    { question: 'How do you completely remove a package including its configuration?', options: ['apt purge package_name', 'apt remove package_name', 'apt delete package_name'] },
  ],

  // Module 5: Networking Essentials
  '5.1': [
    { question: 'Which command shows network interfaces and their configuration?', options: ['ifconfig', 'ipconfig', 'route', 'ping'] },
    { question: "What is the loopback interface used for?", options: ['Communicating with the local machine', 'Connecting to the internet', 'Bridging networks'] },
    { question: 'Which command tests connectivity to another host?', options: ['ping', 'ss', 'lsof', 'nmap'] },
  ],
  '5.2': [
    { question: 'What does DNS stand for?', options: ['Domain Name System', 'Data Network Service', 'Distributed Name Server'] },
    { question: 'What is the primary purpose of DNS?', options: ['Translate domain names to IP addresses', 'Secure network traffic', 'Measure bandwidth'] },
    { question: "What does 'dig example.com' do?", options: ['Show DNS records for example.com', 'Show open ports on example.com', 'Show active connections'] },
  ],
  '5.3': [
    { question: 'What is a network protocol?', options: ['A set of rules for communication', 'A computer program', 'A hardware device'] },
    { question: 'What are network ports used for?', options: ['Identifying specific services on a host', 'Storing files', 'Displaying graphics'] },
    { question: "What does 'nmap -sV' do?", options: ['Detect service versions on open ports', 'Find open users', 'Show running processes'] },
  ],

  // Module 6: Scripting & Automation
  '6.1': [
    { question: 'What is a shell script?', options: ['A text file containing commands', 'A compiled program', 'A binary file'] },
    { question: 'What goes at the top of a bash script?', options: ['#!/bin/bash', '//', '<?php'] },
    { question: 'How do you make a shell script executable?', options: ['chmod +x script.sh', 'bash script.sh', 'run script.sh'] },
    { question: 'How do you access a variable named VAR in bash?', options: ['$VAR', 'VAR', '@VAR', '%VAR'] },
  ],
  '6.2': [
    { question: 'What is cron used for?', options: ['Scheduling recurring tasks', 'Monitoring processes', 'Listing files'] },
    { question: "Which command edits the current user's cron jobs?", options: ['crontab -e', 'cron -e', 'editcron'] },
    { question: 'Which command lists your current cron jobs?', options: ['crontab -l', 'cron -l', 'lscron'] },
  ],

  // Module 7: Process & System Monitoring
  '7.1': [
    { question: 'Which command lists running processes?', options: ['ps', 'ls', 'jobs'] },
    { question: 'Which command shows real-time process activity?', options: ['top', 'ps', 'jobs'] },
    { question: "What does the 'kill' command do?", options: ['Stop a process', 'Start a process', 'List processes'] },
    { question: 'What does Ctrl+C do in the terminal?', options: ['Terminate the foreground process', 'Suspend the process', 'Run it in the background'] },
    { question: 'Which command brings a background job to the foreground?', options: ['fg', 'bg', 'jobs'] },
  ],
  '7.2': [
    { question: 'Which tool provides an interactive process viewer?', options: ['htop', 'ps', 'watch'] },
    { question: 'Which command repeatedly runs another command and refreshes the output?', options: ['watch', 'uptime', 'ps'] },
    { question: 'Which command shows how long the system has been running?', options: ['uptime', 'jobs', 'ps'] },
  ],

  // Module 8: Services, Logging & Troubleshooting
  '8.1': [
    { question: 'What is systemd?', options: ['A service and system manager', 'A text editor', 'A package manager'] },
    { question: 'Which command manages services (start, stop, enable)?', options: ['systemctl', 'journalctl', 'dmesg'] },
    { question: 'How do you start the SSH service?', options: ['systemctl start ssh', 'ssh start', 'service sshd enable'] },
  ],
  '8.2': [
    { question: 'Which command shows kernel-level logs?', options: ['dmesg', 'journalctl -u', 'systemctl'] },
    { question: 'Which command queries the systemd journal?', options: ['journalctl', 'dmesg', 'systemctl'] },
    { question: "What does 'journalctl -f' do?", options: ['Follow new log entries in real time', 'Show logs from last boot only', 'Filter logs by service'] },
  ],
  '8.3': [
    { question: 'What is a safe way to install Python packages without affecting the system?', options: ['Use a virtual environment (venv)', 'Use sudo pip install', 'Install as root'] },
    { question: 'How do you create a virtual environment named myenv?', options: ['python3 -m venv myenv', 'virtualenv myenv', 'pip install venv'] },
    { question: 'Which command activates a venv in bash?', options: ['source myenv/bin/activate', 'venv activate myenv', 'activate myenv'] },
  ],

  // Module 9: Cybersecurity Use Cases
  '9.1': [
    { question: 'Which command securely copies files over SSH?', options: ['scp', 'wget', 'curl', 'nc'] },
    { question: 'Which tool downloads files from HTTP/HTTPS?', options: ['scp', 'wget', 'nc'] },
    { question: 'How do you start a simple HTTP server with Python 3?', options: ['python3 -m http.server 8000', 'python -m SimpleHTTPServer 8000', 'nc -lvp 8000'] },
  ],
  '9.2': [
    { question: 'In a reverse shell, who initiates the connection?', options: ['The target connects to the attacker', 'The attacker connects to the target', 'Both connect simultaneously'] },
    { question: 'What condition does a bind shell require?', options: ['The target listens on a port', 'The attacker listens on a port', 'No network is required'] },
  ],
};

export default quizzes;
