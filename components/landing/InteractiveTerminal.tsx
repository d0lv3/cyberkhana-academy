import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

const USER = 'alumni';
const HOST = 'cyberkhana';

/* ── Virtual filesystem (single home directory) ── */
interface VFile {
  name: string;
  kind: 'file' | 'dir';
  perms: string; // ls -l permission string
  owner: string;
  size: string;
  hidden: boolean;
  rootOnly?: boolean; // requires sudo to read
  render?: (elevated: boolean) => React.ReactNode; // content shown by `cat`
}

const c = (color: string) => (txt: React.ReactNode) => <span style={{ color }}>{txt}</span>;
const green = c('#9fef00');
const dim = c('#6e7a94');
const blue = c('#60a5fa');
const teal = c('#2dd4bf');
const amber = c('#f3a43a');
const white = c('#e6ebf5');

const AboutContent: React.FC = () => (
  <div className="py-1">
    <p>{green('# CyberKhana')}</p>
    <p>{dim('The home of cybersecurity for the Arab world.')}</p>
    <p className="h-2" />
    <p>{teal('## What is CyberKhana?')}</p>
    <p>{white('A hands-on platform where students break, defend, and build —')}</p>
    <p>{white('through interactive labs, CTFs, and real-world tooling.')}</p>
    <p className="h-2" />
    <p>{teal('## CyberKhana Academy')}</p>
    <p>{white('The learning side: a structured journey from the fundamentals')}</p>
    <p>{white('(programming, networking, operating systems) all the way to')}</p>
    <p>{white('job-ready offensive & defensive skills.')}</p>
    <p className="h-2" />
    <p>{green('  - ')}{white('Learn by doing, not by watching')}</p>
    <p>{green('  - ')}{white('Fully bilingual — Arabic & English')}</p>
    <p>{green('  - ')}{white('Practice on live simulations and CTFs')}</p>
    <p>{green('  - ')}{white('Track mastery across 6 security pillars')}</p>
    <p className="h-2" />
    <p>{amber('> Where cybersecurity speaks Arabic.')}</p>
  </div>
);

const FILES: VFile[] = [
  {
    name: 'aboutus.md',
    kind: 'file',
    perms: '-rw-r--r--',
    owner: USER,
    size: '1.4K',
    hidden: false,
    render: () => <AboutContent />,
  },
  {
    name: 'surprise',
    kind: 'file',
    perms: '-rwxr-xr-x',
    owner: USER,
    size: '8.0K',
    hidden: false,
    render: () => (
      <p>{dim('surprise: ELF 64-bit executable — run it with ')}{green('./surprise')}</p>
    ),
  },
  {
    name: 'root.txt',
    kind: 'file',
    perms: '-rwx------',
    owner: 'root',
    size: '33',
    hidden: false,
    rootOnly: true,
    render: (elevated) =>
      elevated ? (
        <div className="py-0.5">
          <p>{green('[+] Root access granted. Nicely done, Alumni.')}</p>
          <p>{white('CYBERKHANA{w3lc0m3_h0m3_4lumn1}')}</p>
        </div>
      ) : null,
  },
  {
    name: '.secret',
    kind: 'file',
    perms: '-rw-r--r--',
    owner: USER,
    size: '128',
    hidden: true,
    render: () => (
      <div className="py-0.5">
        <p>{amber('🎁 You found the hidden file!')}</p>
        <p>{white('Promo code: ')}{green('KHANA5')}</p>
        <p>{dim('Use it at checkout for 5% off your CyberKhana Academy subscription.')}</p>
        <p>{dim("(Pssst — don't tell everyone.)")}</p>
      </div>
    ),
  },
  {
    name: '.bash_history',
    kind: 'file',
    perms: '-rw-------',
    owner: USER,
    size: '92',
    hidden: true,
    render: () => (
      <div className="py-0.5 text-[#9aa5bf]">
        <p>whoami</p>
        <p>ls -la</p>
        <p>cat .secret</p>
        <p>sudo cat root.txt</p>
        <p>nmap -sV 10.0.0.1</p>
      </div>
    ),
  },
];

const findFile = (name: string) => FILES.find((f) => f.name === name);

const FORTUNES = [
  'Security is a process, not a product.',
  'There are two kinds of companies: those that have been hacked, and those that don’t know it yet.',
  'The only truly secure system is one that is powered off. — Gene Spafford',
  'Amateurs hack systems; professionals hack people.',
  'A chain is only as strong as its weakest link — usually the human.',
  'Patch early, patch often.',
  'Trust, but verify. Then verify again.',
  'العلم في الصِّغَر كالنقش على الحجر.',
  'مَن جَدَّ وَجَد — whoever strives, finds.',
];
const randomFortune = () => FORTUNES[Math.floor(Math.random() * FORTUNES.length)];

/* cowsay — but an owl (wisdom). */
const owlSay = (msg: string): React.ReactNode => {
  const bar = '_'.repeat(msg.length + 2);
  const dash = '-'.repeat(msg.length + 2);
  return (
    <pre className="whitespace-pre text-[#9fef00] leading-tight" style={{ fontFamily: MONO }}>
{`  ${bar}
 < ${msg} >
  ${dash}
      \\   ,___,
       \\  (O,O)
          (   )
          "-"-"`}
    </pre>
  );
};

/* sl — the classic "you typed it wrong" steam locomotive. */
const TRAIN = `      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__
 |/-=|___|=O=====O=====O=====O   |_____/~\\___/
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/`;

/* ── Command engine ── */
interface Ctx {
  clear: () => void;
  close: () => void;
  surprise: () => void;
  log: string[];
  rooted: boolean;
  setRoot: (v: boolean) => void;
}

/** Commands offered by Tab-completion. */
const COMMANDS = [
  'whoami', 'id', 'ls', 'cat', 'sudo', 'su', 'pwd', 'cd', 'echo', 'date',
  'uname', 'fortune', 'cowsay', 'history', 'man', 'ssh', 'ping',
  'sl', 'clear', 'help', 'exit', 'hack', 'nmap', 'surprise',
];

const HELP: [string, string][] = [
  ['whoami', 'who are you?'],
  ['id', 'show user & groups'],
  ['ls [-l -a]', 'list files  (try -la)'],
  ['cat <file>', 'read a file'],
  ['sudo <cmd>', 'run as root'],
  ['su', 'become root'],
  ['pwd', 'print working directory'],
  ['cd <dir>', 'change directory'],
  ['echo <text>', 'print text'],
  ['date', 'show the date'],
  ['uname', 'system info'],
  ['fortune', 'a security fortune'],
  ['cowsay <text>', 'an owl says it'],
  ['history', 'command history'],
  ['man <page>', 'read the manual'],
  ['ssh <host>', 'connect over SSH'],
  ['ping <host>', 'ping a host'],
  ['nmap', 'scan some ports'],
  ['sl', 'you’ll see…'],
  ['hack', 'h4ck th3 pl4n3t'],
  ['surprise', 'run ./surprise 👀'],
  ['clear', 'clear the screen'],
  ['exit', 'close the terminal'],
];

function lsLong(files: VFile[]): React.ReactNode {
  const total = files.length * 4;
  return (
    <div className="py-0.5">
      <p>{dim(`total ${total}`)}</p>
      {files.map((f) => {
        const nameNode =
          f.kind === 'dir' ? blue(f.name) : f.perms.includes('x') ? green(f.name) : white(f.name);
        return (
          <p key={f.name} className="whitespace-pre">
            {dim(f.perms.padEnd(11))}
            {dim('1 ')}
            {dim(f.owner.padEnd(7))}
            {dim(f.owner.padEnd(7))}
            {dim(f.size.padStart(5) + '  ')}
            {dim('Jun 13 09:12  ')}
            {nameNode}
          </p>
        );
      })}
    </div>
  );
}

function lsShort(files: VFile[]): React.ReactNode {
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {files.map((f, i) => {
        const node = f.kind === 'dir' ? blue(f.name) : f.perms.includes('x') ? green(f.name) : white(f.name);
        return (
          <span key={f.name}>
            {node}
            {i < files.length - 1 ? '   ' : ''}
          </span>
        );
      })}
    </p>
  );
}

function runCommand(raw: string, elevated: boolean, ctx: Ctx): React.ReactNode | 'CLEAR' | 'CLOSE' {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  // fork bomb — match regardless of spacing
  if (raw.replace(/\s/g, '') === ':(){:|:&};:')
    return <p>{amber('Fork bomb detected. 🍴💣 Nice try — we teach that in a *safe* lab.')}</p>;

  const cmd = parts[0];
  const args = parts.slice(1);
  const isRoot = elevated || ctx.rooted;

  switch (cmd) {
    case 'help':
    case '?':
      return (
        <div className="py-0.5">
          <p>{dim('Available commands:')}</p>
          {HELP.map(([name, desc]) => (
            <p key={name} className="whitespace-pre">
              {green('  ' + name.padEnd(16))}
              {dim(desc)}
            </p>
          ))}
          <p className="h-1.5" />
          <p>{dim('Hint: not every file wants to be read. Some need ')}{green('sudo')}{dim('.')}</p>
        </div>
      );

    case 'whoami':
      return ctx.rooted ? <p>{white('root')}</p> : <p>{green('CyberKhana Alumni')} {dim('🎓')}</p>;

    case 'id':
      return ctx.rooted ? (
        <p className="whitespace-pre-wrap">{white('uid=0(root) gid=0(root) groups=0(root)')}</p>
      ) : (
        <p className="whitespace-pre-wrap">
          {white('uid=1000(')}{green(USER)}{white(') gid=1000(')}{green(USER)}
          {white(') groups=1000(')}{green(USER)}{white('),27(')}{green('sudo')}{white('),1337(')}{green('alumni')}{white(')')}
        </p>
      );

    case 'pwd':
      return <p>{white(`/home/${USER}`)}</p>;

    case 'surprise':
    case './surprise':
      ctx.surprise();
      return (
        <div className="py-0.5">
          <p>{green('[+] Unleashing CyberKhana mode...')}</p>
          <p>{dim('Sit back and enjoy the show. 😎')}</p>
        </div>
      );

    case 'ls': {
      const flags = args.filter((a) => a.startsWith('-')).join('');
      const showAll = flags.includes('a');
      const long = flags.includes('l');
      let visible = FILES.filter((f) => showAll || !f.hidden);
      if (showAll) {
        const dots: VFile[] = [
          { name: '.', kind: 'dir', perms: 'drwxr-xr-x', owner: USER, size: '4.0K', hidden: true },
          { name: '..', kind: 'dir', perms: 'drwxr-xr-x', owner: 'root', size: '4.0K', hidden: true },
        ];
        visible = [...dots, ...visible];
      }
      visible = [...visible].sort((a, b) => a.name.replace(/^\./, '').localeCompare(b.name.replace(/^\./, '')));
      return long ? lsLong(visible) : lsShort(visible);
    }

    case 'cat': {
      if (args.length === 0) return <p>{dim('usage: cat <file>')}</p>;
      const target = args[0];
      const f = findFile(target);
      if (!f) return <p>{white(`cat: ${target}: No such file or directory`)}</p>;
      if (f.kind === 'dir') return <p>{white(`cat: ${target}: Is a directory`)}</p>;
      if (f.rootOnly && !isRoot)
        return (
          <p>
            {white(`cat: ${target}: Permission denied`)} {dim('(try: sudo cat ' + target + ')')}
          </p>
        );
      return f.render ? f.render(isRoot) : null;
    }

    case 'sudo': {
      if (args.length === 0) return <p>{dim('usage: sudo <command>')}</p>;
      if (args.join(' ') === 'make me a sandwich') return <p>{white('Okay. 🥪')}</p>;
      const inner = runCommand(args.join(' '), true, ctx);
      return (
        <div>
          <p>{dim('[sudo] passwordless access — you earned it, Alumni.')}</p>
          {inner !== 'CLEAR' && inner !== 'CLOSE' ? inner : null}
        </div>
      );
    }

    case 'cd':
      return <p>{amber('🏠 You can’t leave home — there’s too much to learn here.')}</p>;

    case 'echo':
      return <p>{white(args.join(' '))}</p>;

    case 'date':
      return <p>{white(new Date().toString())}</p>;

    case 'uname':
      return <p>{white('Linux cyberkhana 6.6.0-academy #1 SMP x86_64 GNU/Linux')}</p>;

    case 'clear':
      ctx.clear();
      return 'CLEAR';

    case 'su':
      if (args.length === 0 || args[0] === 'root') {
        ctx.setRoot(true);
        return (
          <div className="py-0.5">
            <p>{green('[+] Switched to root. With great power… 🧑‍💻')}</p>
            <p>{dim('Type ')}{green('exit')}{dim(' to drop back to alumni.')}</p>
          </div>
        );
      }
      return <p>{white(`su: user ${args[0]} does not exist`)}</p>;

    case 'exit':
    case 'quit':
    case 'logout':
      if (ctx.rooted) {
        ctx.setRoot(false);
        return <p>{dim('logout — back to ')}{green('alumni')}{dim('.')}</p>;
      }
      ctx.close();
      return 'CLOSE';

    /* ── Easter eggs ── */
    case 'hack':
      return (
        <div className="py-0.5">
          <p>{green('Initializing exploit... accessing mainframe... 01001000...')}</p>
          <p>{dim('Just kidding. Real skills > movie hacking. Open a lesson and earn it. 😎')}</p>
        </div>
      );

    case 'rm': {
      const flags = args.filter((a) => a.startsWith('-')).join('');
      const recursiveForce = (flags.includes('r') && flags.includes('f')) || raw.includes('--no-preserve-root');
      const targets = args.filter((a) => !a.startsWith('-'));
      const nukesSystem = targets.some(
        (t) => t === '/' || t === '/*' || t === '*' || t === '~' || t === '~/*' || t.startsWith('/'),
      );
      if (recursiveForce && nukesSystem) {
        const who = ctx.rooted ? 'root' : USER;
        return (
          <div className="py-0.5">
            <p>{dim('removing /bin ...')}</p>
            <p>{dim('removing /boot ...')}</p>
            <p>{dim('removing /etc ...')}</p>
            <p>{dim('removing /home ...')}</p>
            <p>{dim('removing /lib ...')}</p>
            <p>{dim('removing /usr ...')}</p>
            <p>{amber('rm: it is dangerous to operate recursively on ‘/’')}</p>
            <p className="h-1.5" />
            <p>{c('#ef4444')(`⚠  Listen here, ${who}.`)}</p>
            <p>{white('You do that again and you’re the one who will be ')}{c('#ef4444')('rm -rf /*')}</p>
            <p>{dim('(nothing was harmed — this is a sandbox 😉)')}</p>
          </div>
        );
      }
      return <p>{white(`rm: cannot remove '${args[args.length - 1] ?? ''}': Operation not permitted`)}</p>;
    }

    case 'nmap':
      return (
        <div className="py-0.5">
          <p>{dim('Starting Nmap scan...')}</p>
          <p>{white('22/tcp  ')}{green('open')}{white('  ssh')}</p>
          <p>{white('80/tcp  ')}{green('open')}{white('  http')}</p>
          <p>{dim('Want the real thing? It’s a lesson inside. ')}{green('→ Start Learning')}</p>
        </div>
      );

    case 'fortune':
      return <p className="whitespace-pre-wrap">{teal(randomFortune())}</p>;

    case 'cowsay':
      return owlSay(args.length ? args.join(' ') : randomFortune());

    case 'sl':
      return (
        <pre className="whitespace-pre text-[#9fef00] text-[10px] leading-tight" style={{ fontFamily: MONO }}>
          {TRAIN}
        </pre>
      );

    case 'history':
      if (ctx.log.length === 0) return <p>{dim('(no history yet)')}</p>;
      return (
        <div className="py-0.5">
          {ctx.log.map((entry, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {dim(String(i + 1).padStart(4) + '  ')}
              {white(entry)}
            </p>
          ))}
        </div>
      );

    case 'ssh':
      return (
        <div className="py-0.5">
          <p>{white(`${args[0] ?? 'root@10.0.0.1'}: `)}{amber('Permission denied (publickey).')}</p>
          <p>{dim('SSH, keys & hardening are a lesson inside. ')}{green('→ Start Learning')}</p>
        </div>
      );

    case 'ping': {
      const host = args.find((a) => !a.startsWith('-')) ?? 'cyberkhana.tech';
      return (
        <div className="py-0.5">
          <p>{white(`PING ${host}: 56 data bytes`)}</p>
          <p>{white(`64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.42 ms`)}</p>
          <p>{white(`64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.39 ms`)}</p>
          <p>{dim('How does this actually work? Networking 101 → inside.')}</p>
        </div>
      );
    }

    case 'man': {
      if (args.length === 0)
        return <p>{dim('What manual page do you want? e.g. ')}{green('man hacking')}</p>;
      if (args[0] === 'hacking')
        return (
          <div className="py-0.5">
            <p>{teal('THE HACKER ETHIC(7)')}</p>
            <p>{white('1. Be curious. Take things apart to understand them.')}</p>
            <p>{white('2. Only ever touch systems you own or are authorized to test.')}</p>
            <p>{white('3. Build more than you break.')}</p>
            <p>{white('4. Share what you learn. Lift others up.')}</p>
            <p>{dim('— the CyberKhana way')}</p>
          </div>
        );
      const h = HELP.find(([n]) => n.split(' ')[0] === args[0]);
      if (h) return <p>{white(h[0])} {dim('— ' + h[1])}</p>;
      return <p>{white(`No manual entry for ${args[0]}`)}</p>;
    }

    case 'vim':
    case 'nano':
    case 'vi':
      return <p>{dim(`${cmd}: this is a demo shell — no editor here. Try `)}{green('cat')}{dim(' instead.')}</p>;

    default:
      return (
        <p>
          {white(`${cmd}: command not found`)} {dim("— type 'help' for the list")}
        </p>
      );
  }
}

/* ── History entry ── */
interface Entry {
  prompt?: string; // the typed command (echoed)
  rooted?: boolean; // prompt style at the time it was entered
  output: React.ReactNode;
}

const Prompt: React.FC<{ rooted?: boolean }> = ({ rooted }) =>
  rooted ? (
    <span className="whitespace-pre">
      {c('#ef4444')(`root@${HOST}`)}
      {white(':')}
      {blue('~')}
      {c('#ef4444')('# ')}
    </span>
  ) : (
    <span className="whitespace-pre">
      {green(`${USER}@${HOST}`)}
      {white(':')}
      {blue('~')}
      {white('$ ')}
    </span>
  );

const WELCOME: Entry = {
  output: (
    <div className="py-0.5">
      <p>{green('CyberKhana Academy')} {dim('— demo shell v1.0')}</p>
      <p>{white("You're logged in as ")}{green("'alumni'")}{white(' — one of our own. 🎓')}</p>
      <p>{dim('Try ')}{green('ls -la')}{dim(', ')}{green('cat aboutus.md')}{dim(', or read ')}{green('root.txt')}{dim('.')}</p>
      <p>{dim("Type ")}{green("'help'")}{dim(' for commands, ')}{green("'exit'")}{dim(' to close.')}</p>
    </div>
  ),
};

interface InteractiveTerminalProps {
  open: boolean;
  onClose: () => void;
  onSurprise: () => void;
  /** Viewport coords of the small terminal card — the panel grows from here. */
  anchor: { top: number; left: number };
}

/* Panel grows down + right from its anchor; clamped to stay on-screen. */
const PANEL_W = 480;
const PANEL_H = 400;

const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({ open, onClose, onSurprise, anchor }) => {
  const [history, setHistory] = useState<Entry[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [cmdLog, setCmdLog] = useState<string[]>([]);
  const [logIdx, setLogIdx] = useState(-1);
  const [rooted, setRooted] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history]);

  // focus on open; close on ESC or when the page scrolls (panel is fixed)
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [open, onClose]);

  const submit = useCallback(
    (raw: string) => {
      const wasRooted = rooted;
      const result = runCommand(raw, false, {
        clear: () => setHistory([]),
        close: onClose,
        surprise: onSurprise,
        log: cmdLog,
        rooted: wasRooted,
        setRoot: setRooted,
      });
      if (raw.trim()) setCmdLog((l) => [...l, raw]);
      setLogIdx(-1);

      if (result === 'CLEAR') {
        setHistory([]);
        return;
      }
      if (result === 'CLOSE') return;
      setHistory((h) => [...h, { prompt: raw, rooted: wasRooted, output: result }]);
    },
    [onClose, onSurprise, cmdLog, rooted]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      // Complete the command/filename inside the terminal — never tab off it.
      e.preventDefault();
      const parts = input.split(' ');
      const isCommand = parts.length === 1;
      const token = parts[parts.length - 1];

      const pool = isCommand ? COMMANDS : FILES.map((f) => f.name);
      let candidates = pool.filter((name) => name.startsWith(token));
      // hidden files only surface when the user explicitly types a leading dot
      if (!isCommand) {
        candidates = candidates.filter((name) => (name.startsWith('.') ? token.startsWith('.') : true));
      }
      if (candidates.length === 0) return;

      if (candidates.length === 1) {
        parts[parts.length - 1] = candidates[0];
        setInput(parts.join(' ') + (isCommand ? ' ' : ''));
        return;
      }

      // multiple matches → extend to the longest common prefix, else list them
      let lcp = candidates[0];
      for (const cand of candidates) {
        while (!cand.startsWith(lcp)) lcp = lcp.slice(0, -1);
      }
      if (lcp.length > token.length) {
        parts[parts.length - 1] = lcp;
        setInput(parts.join(' '));
      } else {
        setHistory((h) => [
          ...h,
          { output: <p className="text-[#6e7a94] whitespace-pre-wrap">{candidates.join('   ')}</p> },
        ]);
      }
      return;
    }
    if (e.key === 'Enter') {
      submit(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdLog.length === 0) return;
      const next = logIdx === -1 ? cmdLog.length - 1 : Math.max(0, logIdx - 1);
      setLogIdx(next);
      setInput(cmdLog[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (logIdx === -1) return;
      const next = logIdx + 1;
      if (next >= cmdLog.length) {
        setLogIdx(-1);
        setInput('');
      } else {
        setLogIdx(next);
        setInput(cmdLog[next]);
      }
    }
  };

  if (typeof document === 'undefined') return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const left = Math.max(12, Math.min(anchor.left, vw - PANEL_W - 16));
  const top = Math.max(12, Math.min(anchor.top, vh - PANEL_H - 16));

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ scale: 0.18, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.18, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          style={{ position: 'fixed', top, left, width: PANEL_W, height: PANEL_H, transformOrigin: 'top left' }}
          className="z-[120] max-w-[92vw] max-h-[78vh] rounded-xl border border-[#263248] bg-[#080c14] shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
          dir="ltr"
        >
          <div className="flex flex-col h-full">
            {/* chrome */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#151d2e] bg-[#0b1019] flex-shrink-0">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-125 transition"
                aria-label="Close terminal"
              />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[11px] font-semibold text-[#6e7a94]" style={{ fontFamily: MONO }}>
                {USER}@{HOST}: ~
              </span>
              <button
                onClick={onClose}
                className="ml-auto text-[#4d5a73] hover:text-[#d2d7e3] transition"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* body */}
            <div
              ref={bodyRef}
              onClick={() => inputRef.current?.focus()}
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-[12.5px] leading-relaxed cursor-text"
              style={{ fontFamily: MONO }}
            >
              {history.map((entry, i) => (
                <div key={i} className="mb-1">
                  {entry.prompt !== undefined && (
                    <p className="whitespace-pre-wrap break-words">
                      <Prompt rooted={entry.rooted} />
                      <span className="text-[#e6ebf5]">{entry.prompt}</span>
                    </p>
                  )}
                  {entry.output}
                </div>
              ))}

              {/* live input line */}
              <div className="flex items-center">
                <Prompt rooted={rooted} />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  className="flex-1 bg-transparent border-none outline-none text-[#e6ebf5] caret-[#9fef00] p-0 m-0"
                  style={{ fontFamily: MONO, fontSize: '12.5px' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default InteractiveTerminal;
