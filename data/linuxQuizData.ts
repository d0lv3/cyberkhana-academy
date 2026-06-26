export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type LessonQuiz = QuizQuestion[];

// Quizzes keyed by lecture ID
const quizzes: Record<string, LessonQuiz> = {
  // Module 2: The Linux Terminal
  '2.1': [
    { question: 'What does GUI stand for?', options: ['Graphical Universe Interface', 'Graphical Unified Interface', 'Graphical User Interface'], correctIndex: 2 },
    { question: 'What does CLI stand for?', options: ['Command Line Interface', 'Command Layout Interface', 'Command Light Interface'], correctIndex: 0 },
    { question: "What is the purpose of the 'echo' command?", options: ['Print the contents of a file', 'Delete a file', 'Print the text that follows it'], correctIndex: 2 },
    { question: "What does the 'whoami' command display?", options: ['Current directory listing', 'Your username', 'System uptime'], correctIndex: 1 },
  ],
  '2.2': [
    { question: 'What type of data is stored in /etc?', options: ['User home directories', 'System configuration files', 'Temporary files'], correctIndex: 1 },
    { question: 'What is the /home directory used for?', options: ['System binaries', 'Personal user files', 'Log files'], correctIndex: 1 },
    { question: 'What kind of data does /var typically contain?', options: ['Variable data such as logs', 'User home directories', 'Kernel source code'], correctIndex: 0 },
    { question: "What does the 'pwd' command display?", options: ['Current working directory', 'Available disk space', 'Running processes'], correctIndex: 0 },
    { question: "What is the function of the 'ls' command?", options: ['Change directory', 'List directory contents', 'Create new files'], correctIndex: 1 },
    { question: "What does the 'cd' command do?", options: ['Change directory', 'Copy files', 'Delete files'], correctIndex: 0 },
  ],
  '2.3': [
    { question: "What does the 'touch' command create?", options: ['An empty file', 'A new directory', 'A symbolic link'], correctIndex: 0 },
    { question: "What is the purpose of 'mkdir'?", options: ['Move files', 'Create a new directory', 'Delete a directory'], correctIndex: 1 },
    { question: "What does the 'cp' command do?", options: ['Copy files or directories', 'Change file permissions', 'Compress files'], correctIndex: 0 },
    { question: "What does 'mv' do?", options: ['Move or rename files', 'Display running processes', 'Delete files'], correctIndex: 0 },
    { question: "What is the function of 'rm'?", options: ['Remove files or directories', 'Rename files', 'Read a file'], correctIndex: 0 },
    { question: "What does 'cat' do?", options: ['Display file contents only', 'Concatenate files only', 'Both display and concatenate files'], correctIndex: 2 },
    { question: "What does the 'tree' command show?", options: ['Directory structure in tree format', "A file's permissions", 'Process hierarchy'], correctIndex: 0 },
    { question: "What does the 'man' command provide?", options: ['Manual pages for commands', 'System logs', 'File sizes'], correctIndex: 0 },
  ],
  '2.4': [
    { question: 'What does tab completion do in the terminal?', options: ['Automatically completes commands or filenames', 'Opens a text editor', 'Shows command history'], correctIndex: 0 },
    { question: "What is 'nano' used for?", options: ['Editing text files', 'Viewing logs', 'Compiling code'], correctIndex: 0 },
    { question: 'What does the pipe operator (|) do?', options: ['Redirect output of one command to another', 'Run commands in parallel', 'Save output to a file'], correctIndex: 0 },
    { question: "What is 'grep' used for?", options: ['Searching for patterns in text', 'Displaying system status', 'Compressing files'], correctIndex: 0 },
    { question: 'What does the output redirection operator (>) do?', options: ['Send output to a file', 'Display output in reverse', 'Send output to another machine'], correctIndex: 0 },
    { question: "What does chaining commands with '&&' do?", options: ['Run the second command only if the first succeeds', 'Run the second command only if the first fails', 'Run both commands simultaneously'], correctIndex: 0 },
  ],

  // Module 3: Users, Permissions & Root Access
  '3.1': [
    { question: 'What are users in Linux?', options: ['Accounts that can log in and run programs', 'Files on the system', 'Groups of commands'], correctIndex: 0 },
    { question: 'What are groups in Linux?', options: ['Collections of users', 'Individual files', 'Running processes'], correctIndex: 0 },
    { question: 'Which command adds a new user?', options: ['useradd', 'usermod', 'groups', 'passwd'], correctIndex: 0 },
    { question: 'Which command modifies an existing user?', options: ['usermod', 'userdel', 'id', 'groups'], correctIndex: 0 },
    { question: 'Which command deletes a user account?', options: ['usermod', 'userdel', 'passwd', 'useradd'], correctIndex: 1 },
    { question: "Which command displays a user's ID and group information?", options: ['id', 'groups', 'useradd', 'userdel'], correctIndex: 0 },
  ],
  '3.2': [
    { question: "What does 'chmod' do?", options: ['Change file permissions', 'Change file ownership', 'List files', 'Delete files'], correctIndex: 0 },
    { question: "What does 'chown' do?", options: ['Change file ownership', 'Change file permissions', 'Show file contents', 'Move files'], correctIndex: 0 },
    { question: "What information does 'ls -l' display?", options: ['Detailed file info including permissions and owner', 'Only file names', 'Only directories', 'Running processes'], correctIndex: 0 },
    { question: 'What are the three types of file permissions in Linux?', options: ['Read, Write, Execute', 'Start, Stop, Pause', 'Create, Delete, Modify'], correctIndex: 0 },
    { question: 'Which permission categories apply to a file?', options: ['Owner, Group, Others', 'Root only', 'All users equally'], correctIndex: 0 },
    { question: 'How do you give execute permission to a file?', options: ['chmod +x filename', 'chmod -x filename', 'chown user filename'], correctIndex: 0 },
  ],
  '3.3': [
    { question: 'What is the root user in Linux?', options: ['The superuser with full system access', 'A normal user', 'A group of users'], correctIndex: 0 },
    { question: "What does 'sudo' do?", options: ['Run a command as root or another user', 'Delete files', 'Show system info'], correctIndex: 0 },
    { question: "Why use 'sudo' instead of logging in as root?", options: ['For safety and controlled access', 'Because root is slower', 'To list files faster'], correctIndex: 0 },
    { question: 'Which file controls sudo access?', options: ['/etc/sudoers', '/etc/passwd', '/etc/group', '/etc/shadow'], correctIndex: 0 },
  ],

  // Module 4: Package & Tool Management
  '4.1': [
    { question: "What does 'apt update' do?", options: ['Update the package index', 'Install new packages', 'Remove packages'], correctIndex: 0 },
    { question: "What does 'apt upgrade' do?", options: ['Upgrade installed packages', 'Install new packages', 'Remove packages'], correctIndex: 0 },
    { question: 'How do you install a package using APT?', options: ['apt install package_name', 'apt remove package_name', 'apt update'], correctIndex: 0 },
    { question: 'How do you remove a package using APT?', options: ['apt remove package_name', 'apt install package_name', 'apt upgrade'], correctIndex: 0 },
  ],
  '4.2': [
    { question: "What is 'dpkg' used for?", options: ['Install or manage .deb packages directly', 'Upgrade all packages', 'Update the package index'], correctIndex: 0 },
    { question: 'How do you install a .deb package with dpkg?', options: ['dpkg -i package.deb', 'apt install package.deb', 'dpkg -r package.deb'], correctIndex: 0 },
    { question: 'How do you completely remove a package including its configuration?', options: ['apt purge package_name', 'apt remove package_name', 'apt delete package_name'], correctIndex: 0 },
  ],

  // Module 5: Networking Essentials
  '5.1': [
    { question: 'Which command shows network interfaces and their configuration?', options: ['ifconfig', 'ipconfig', 'route', 'ping'], correctIndex: 0 },
    { question: "What is the loopback interface used for?", options: ['Communicating with the local machine', 'Connecting to the internet', 'Bridging networks'], correctIndex: 0 },
    { question: 'Which command tests connectivity to another host?', options: ['ping', 'ss', 'lsof', 'nmap'], correctIndex: 0 },
  ],
  '5.2': [
    { question: 'What does DNS stand for?', options: ['Domain Name System', 'Data Network Service', 'Distributed Name Server'], correctIndex: 0 },
    { question: 'What is the primary purpose of DNS?', options: ['Translate domain names to IP addresses', 'Secure network traffic', 'Measure bandwidth'], correctIndex: 0 },
    { question: "What does 'dig example.com' do?", options: ['Show DNS records for example.com', 'Show open ports on example.com', 'Show active connections'], correctIndex: 0 },
  ],
  '5.3': [
    { question: 'What is a network protocol?', options: ['A set of rules for communication', 'A computer program', 'A hardware device'], correctIndex: 0 },
    { question: 'What are network ports used for?', options: ['Identifying specific services on a host', 'Storing files', 'Displaying graphics'], correctIndex: 0 },
    { question: "What does 'nmap -sV' do?", options: ['Detect service versions on open ports', 'Find open users', 'Show running processes'], correctIndex: 0 },
  ],

  // Module 6: Scripting & Automation
  '6.1': [
    { question: 'What is a shell script?', options: ['A text file containing commands', 'A compiled program', 'A binary file'], correctIndex: 0 },
    { question: 'What goes at the top of a bash script?', options: ['#!/bin/bash', '//', '<?php'], correctIndex: 0 },
    { question: 'How do you make a shell script executable?', options: ['chmod +x script.sh', 'bash script.sh', 'run script.sh'], correctIndex: 0 },
    { question: 'How do you access a variable named VAR in bash?', options: ['$VAR', 'VAR', '@VAR', '%VAR'], correctIndex: 0 },
  ],
  '6.2': [
    { question: 'What is cron used for?', options: ['Scheduling recurring tasks', 'Monitoring processes', 'Listing files'], correctIndex: 0 },
    { question: "Which command edits the current user's cron jobs?", options: ['crontab -e', 'cron -e', 'editcron'], correctIndex: 0 },
    { question: 'Which command lists your current cron jobs?', options: ['crontab -l', 'cron -l', 'lscron'], correctIndex: 0 },
  ],

  // Module 7: Process & System Monitoring
  '7.1': [
    { question: 'Which command lists running processes?', options: ['ps', 'ls', 'jobs'], correctIndex: 0 },
    { question: 'Which command shows real-time process activity?', options: ['top', 'ps', 'jobs'], correctIndex: 0 },
    { question: "What does the 'kill' command do?", options: ['Stop a process', 'Start a process', 'List processes'], correctIndex: 0 },
    { question: 'What does Ctrl+C do in the terminal?', options: ['Terminate the foreground process', 'Suspend the process', 'Run it in the background'], correctIndex: 0 },
    { question: 'Which command brings a background job to the foreground?', options: ['fg', 'bg', 'jobs'], correctIndex: 0 },
  ],
  '7.2': [
    { question: 'Which tool provides an interactive process viewer?', options: ['htop', 'ps', 'watch'], correctIndex: 0 },
    { question: 'Which command repeatedly runs another command and refreshes the output?', options: ['watch', 'uptime', 'ps'], correctIndex: 0 },
    { question: 'Which command shows how long the system has been running?', options: ['uptime', 'jobs', 'ps'], correctIndex: 0 },
  ],

  // Module 8: Services, Logging & Troubleshooting
  '8.1': [
    { question: 'What is systemd?', options: ['A service and system manager', 'A text editor', 'A package manager'], correctIndex: 0 },
    { question: 'Which command manages services (start, stop, enable)?', options: ['systemctl', 'journalctl', 'dmesg'], correctIndex: 0 },
    { question: 'How do you start the SSH service?', options: ['systemctl start ssh', 'ssh start', 'service sshd enable'], correctIndex: 0 },
  ],
  '8.2': [
    { question: 'Which command shows kernel-level logs?', options: ['dmesg', 'journalctl -u', 'systemctl'], correctIndex: 0 },
    { question: 'Which command queries the systemd journal?', options: ['journalctl', 'dmesg', 'systemctl'], correctIndex: 0 },
    { question: "What does 'journalctl -f' do?", options: ['Follow new log entries in real time', 'Show logs from last boot only', 'Filter logs by service'], correctIndex: 0 },
  ],
  '8.3': [
    { question: 'What is a safe way to install Python packages without affecting the system?', options: ['Use a virtual environment (venv)', 'Use sudo pip install', 'Install as root'], correctIndex: 0 },
    { question: 'How do you create a virtual environment named myenv?', options: ['python3 -m venv myenv', 'virtualenv myenv', 'pip install venv'], correctIndex: 0 },
    { question: 'Which command activates a venv in bash?', options: ['source myenv/bin/activate', 'venv activate myenv', 'activate myenv'], correctIndex: 0 },
  ],

  // Module 9: Cybersecurity Use Cases
  '9.1': [
    { question: 'Which command securely copies files over SSH?', options: ['scp', 'wget', 'curl', 'nc'], correctIndex: 0 },
    { question: 'Which tool downloads files from HTTP/HTTPS?', options: ['scp', 'wget', 'nc'], correctIndex: 1 },
    { question: 'How do you start a simple HTTP server with Python 3?', options: ['python3 -m http.server 8000', 'python -m SimpleHTTPServer 8000', 'nc -lvp 8000'], correctIndex: 0 },
  ],
  '9.2': [
    { question: 'In a reverse shell, who initiates the connection?', options: ['The target connects to the attacker', 'The attacker connects to the target', 'Both connect simultaneously'], correctIndex: 0 },
    { question: 'What condition does a bind shell require?', options: ['The target listens on a port', 'The attacker listens on a port', 'No network is required'], correctIndex: 0 },
  ],
};

export default quizzes;
