/**
 * Exercises the C++ standard-library support the runner adds on top of JSCPP:
 * std::string, std::vector, and const enforcement.
 *
 * It drives the same code path the student does — prepareCppSource, the
 * injected includes, and the const check — so a pass here means the browser
 * behaves the same way.
 *
 * Usage: npm run verify:cpp-stdlib
 */
import JSCPP from 'JSCPP';
import { installString, wireStringToStreams } from '../components/code-editor/cpp-stdlib/cppString.ts';
import { installVector, eraseTemplateArgs } from '../components/code-editor/cpp-stdlib/cppVector.ts';
import { findConstViolation } from '../components/code-editor/cpp-stdlib/constCheck.ts';
import { repairLiteralSpaces } from '../components/code-editor/cpp-stdlib/literalSpaces.ts';

/* The leaf modules are imported directly rather than through the barrel: node
 * needs a file extension and the app source deliberately does not carry one.
 * This mirrors cpp-stdlib/index.ts — keep the two in step if that changes. */
const CPP_STDLIB_INCLUDES = {
  string: { load: (rt) => wireStringToStreams(rt, installString(rt)) },
  vector: {
    load: (rt) => {
      installVector(rt);
      wireStringToStreams(rt, installString(rt));
    },
  },
};
const prepareCppSource = (src) =>
  `${repairLiteralSpaces(eraseTemplateArgs(src))}\n#include <string>\n#include <vector>\n`;

let pass = 0;
let fail = 0;

/** Run through the same pipeline CppExecutor uses. */
function execute(code, stdin = '') {
  const violation = findConstViolation(code);
  if (violation) return { output: '', error: violation.message };
  let output = '';
  try {
    JSCPP.run(prepareCppSource(code), stdin, {
      stdio: { write: (s) => { output += s; } },
      includes: CPP_STDLIB_INCLUDES,
      maxTimeout: 5000,
    });
    return { output, error: null };
  } catch (e) {
    return { output, error: (e?.message ?? String(e)).split('\n')[0] };
  }
}

function expectOutput(name, code, want, stdin = '') {
  const { output, error } = execute(code, stdin);
  if (error) {
    console.log(`FAIL  ${name}\n      raised: ${error}`);
    fail++;
  } else if (output !== want) {
    console.log(`FAIL  ${name}\n      expected: ${JSON.stringify(want)}\n      got     : ${JSON.stringify(output)}`);
    fail++;
  } else {
    console.log(`  ok  ${name}`);
    pass++;
  }
}

function expectError(name, code, mustContain) {
  const { error } = execute(code);
  if (!error) {
    console.log(`FAIL  ${name}\n      expected an error, the program ran cleanly`);
    fail++;
  } else if (mustContain && !error.includes(mustContain)) {
    console.log(`FAIL  ${name}\n      expected an error containing ${JSON.stringify(mustContain)}\n      got     : ${error}`);
    fail++;
  } else {
    console.log(`  ok  ${name}  (${error.slice(0, 62)})`);
    pass++;
  }
}

const main = (body, headers = '') =>
  `#include <iostream>\n${headers}using namespace std;\nint main() {\n${body}\n  return 0;\n}\n`;

console.log('\nstd::string\n');
expectOutput('declare then assign', main('  string s;\n  s = "hello";\n  cout << s << endl;'), 'hello\n');
expectOutput('initialise from a literal', main('  string s = "hello";\n  cout << s << endl;'), 'hello\n');
expectOutput('works without #include <string>', main('  string s = "no include";\n  cout << s << endl;'), 'no include\n');
expectOutput('works with #include <string>', main('  string s = "with include";\n  cout << s << endl;', '#include <string>\n'), 'with include\n');
expectOutput('concatenation', main('  string a = "foo";\n  string b = "bar";\n  cout << a + b << endl;'), 'foobar\n');
expectOutput('append with +=', main('  string s = "foo";\n  s += "bar";\n  cout << s << endl;'), 'foobar\n');
expectOutput('length and size', main('  string s = "hello";\n  cout << s.length() << " " << s.size() << endl;'), '5 5\n');
expectOutput('indexing', main('  string s = "hello";\n  cout << s[0] << s[4] << endl;'), 'ho\n');
expectOutput('at()', main('  string s = "hello";\n  cout << s.at(1) << endl;'), 'e\n');
expectOutput('substr with length', main('  string s = "hello world";\n  cout << s.substr(0, 5) << endl;'), 'hello\n');
expectOutput('substr to the end', main('  string s = "hello world";\n  cout << s.substr(6) << endl;'), 'world\n');
expectOutput('find', main('  string s = "hello world";\n  cout << s.find("world") << endl;'), '6\n');
expectOutput('comparisons', main('  string a = "abc";\n  string b = "abd";\n  cout << (a == a) << (a != b) << (a < b) << endl;'), '111\n');
expectOutput('empty and clear', main('  string s = "x";\n  cout << s.empty();\n  s.clear();\n  cout << s.empty() << endl;'), '01\n');
expectOutput('copies are independent', main('  string a = "one";\n  string b = a;\n  b += " two";\n  cout << a << "|" << b << endl;'), 'one|one two\n');
expectOutput('iterate the characters', main('  string s = "abc";\n  for (int i = 0; i < s.length(); i++) { cout << s[i]; }\n  cout << endl;'), 'abc\n');
expectOutput('as a function parameter',
  '#include <iostream>\nusing namespace std;\nstring shout(string s) { return s + "!"; }\nint main() { cout << shout("hi") << endl; return 0; }\n', 'hi!\n');
expectOutput('cin >> string', main('  string s;\n  cin >> s;\n  cout << "[" << s << "]" << endl;'), '[hello]\n', '  hello world ');
expectOutput('getline(cin, s)', main('  string s;\n  getline(cin, s);\n  cout << "[" << s << "]" << endl;'), '[hello world]\n', 'hello world\nnext');

console.log('\nstd::vector\n');
expectOutput('push_back and size', main('  vector<int> v;\n  v.push_back(10);\n  v.push_back(20);\n  cout << v.size() << endl;'), '2\n');
expectOutput('read by index', main('  vector<int> v;\n  v.push_back(7);\n  v.push_back(9);\n  cout << v[0] << " " << v[1] << endl;'), '7 9\n');
expectOutput('write by index', main('  vector<int> v;\n  v.push_back(1);\n  v[0] = 42;\n  cout << v[0] << endl;'), '42\n');
expectOutput('iterate', main('  vector<int> v;\n  for (int i = 0; i < 5; i++) { v.push_back(i * i); }\n  for (int i = 0; i < v.size(); i++) { cout << v[i] << " "; }\n  cout << endl;'), '0 1 4 9 16 \n');
expectOutput('at, front, back', main('  vector<int> v;\n  v.push_back(3); v.push_back(5); v.push_back(8);\n  cout << v.at(1) << v.front() << v.back() << endl;'), '538\n');
expectOutput('empty, pop_back, clear', main('  vector<int> v;\n  cout << v.empty();\n  v.push_back(1); v.push_back(2);\n  v.pop_back();\n  cout << v.size();\n  v.clear();\n  cout << v.empty() << endl;'), '111\n');
expectOutput('vector of strings', main('  vector<string> n;\n  n.push_back("sara");\n  n.push_back("omar");\n  cout << n[0] << "," << n[1] << endl;'), 'sara,omar\n');
expectOutput('vector of doubles', main('  vector<double> v;\n  v.push_back(1.5);\n  v.push_back(2.5);\n  cout << v[0] + v[1] << endl;'), '4\n');
expectOutput('copies are independent', main('  vector<int> a;\n  a.push_back(1);\n  vector<int> b = a;\n  b.push_back(2);\n  cout << a.size() << b.size() << endl;'), '12\n');
expectOutput('as a function parameter',
  '#include <iostream>\n#include <vector>\nusing namespace std;\nint total(vector<int> v) { int s = 0; for (int i = 0; i < v.size(); i++) { s += v[i]; } return s; }\nint main() { vector<int> v; v.push_back(2); v.push_back(3); cout << total(v) << endl; return 0; }\n', '5\n');
expectError('index out of range is reported', main('  vector<int> v;\n  v.push_back(1);\n  cout << v[5] << endl;'), 'out of range');

console.log('\nless-than is still less-than\n');
expectOutput('a < b is untouched', main('  int a = 1;\n  int b = 2;\n  cout << (a < b) << endl;'), '1\n');
expectOutput('chained comparison', main('  int a = 1, b = 2, c = 3;\n  cout << (a < b) << (b < c) << endl;'), '11\n');
expectOutput('the word vector inside a string', main('  cout << "vector<int> is a template" << endl;'), 'vector<int> is a template\n');

console.log('\nconst\n');
expectError('reassigning a const int', main('  const int x = 5;\n  x = 99;\n  cout << x << endl;'), "read-only variable 'x'");
expectError('reassigning a const double', main('  const double PI = 3.14;\n  PI = 9.9;\n  cout << PI << endl;'), "read-only variable 'PI'");
expectError('compound assignment', main('  const int x = 5;\n  x += 1;\n  cout << x << endl;'), "read-only variable 'x'");
expectError('increment', main('  const int x = 5;\n  x++;\n  cout << x << endl;'), "read-only variable 'x'");
expectError('const in C', '#include <stdio.h>\nint main() {\n  const int x = 5;\n  x = 9;\n  return 0;\n}\n', "read-only variable 'x'");
expectOutput('reading a const is fine', main('  const int x = 5;\n  cout << x * 2 << endl;'), '10\n');
expectOutput('a normal variable is untouched', main('  int x = 5;\n  x = 99;\n  cout << x << endl;'), '99\n');
expectOutput('similar name is not confused', main('  const int x = 5;\n  int xs = 1;\n  xs = 2;\n  cout << x << xs << endl;'), '52\n');
expectOutput('== is not an assignment', main('  const int x = 5;\n  cout << (x == 5) << endl;'), '1\n');
expectOutput('const name inside a string', main('  const int x = 5;\n  cout << "x = 99" << endl;'), 'x = 99\n');
expectOutput('const name inside a comment', main('  const int x = 5;\n  // x = 99;\n  cout << x << endl;'), '5\n');
expectOutput('multiple declarators', main('  const int a = 1, b = 2;\n  cout << a + b << endl;'), '3\n');
expectError('second declarator is const too', main('  const int a = 1, b = 2;\n  b = 5;\n  cout << b << endl;'), "read-only variable 'b'");
expectError('declaration and assignment on one line',
  '#include <stdio.h>\nint main(){ const int x = 1; x = 2; return 0; }\n', "read-only variable 'x'");
expectOutput('a declarator list split over lines is not an assignment',
  main('  const int a = 1,\n            b = 2;\n  cout << a + b << endl;'), '3\n');

console.log('\nstring literals survive the preprocessor\n');
/* JSCPP's preprocessor rebuilds every call's argument list and eats the space
   after a comma inside a literal — see cpp-stdlib/literalSpaces.ts. */
expectOutput('comma-space inside printf',
  '#include <stdio.h>\nint main(){ printf("Hello, World!\\n"); return 0; }\n', 'Hello, World!\n');
expectOutput('comma-space in a format string',
  '#include <stdio.h>\nint main(){ printf("%d, %d\\n", 1, 2); return 0; }\n', '1, 2\n');
expectOutput('several spaces after a comma',
  '#include <stdio.h>\nint main(){ printf("a,   b\\n"); return 0; }\n', 'a,   b\n');
expectOutput('comma-space inside puts',
  '#include <stdio.h>\nint main(){ puts("Hello, World!"); return 0; }\n', 'Hello, World!');
expectOutput('a literal passed to a nested call keeps its length',
  '#include <iostream>\n#include <cstring>\nusing namespace std;\nint main(){ cout << strlen("a, b") << endl; return 0; }\n', '4\n');
expectOutput('cout is unaffected',
  main('  cout << "Hello, World!" << endl;'), 'Hello, World!\n');
expectOutput('a space before the comma is left alone',
  '#include <stdio.h>\nint main(){ printf("a , b\\n"); return 0; }\n', 'a , b\n');
expectOutput('a hex digit after the repaired space is not swallowed',
  '#include <stdio.h>\nint main(){ printf("a, Abc\\n"); return 0; }\n', 'a, Abc\n');
expectOutput('a comma in a comment is not touched',
  main('  // hello, world\n  cout << "ok" << endl;'), 'ok\n');
expectOutput('a std::string literal keeps its spacing',
  main('  string s = "Hello, World!";\n  cout << s << endl;'), 'Hello, World!\n');

console.log('\nC stdio in the browser bundle\n');
/* Node has a real `stream` module, so a printf that works here can still fail
   in the browser — see shims/node-stream.ts. This asserts the C side of the
   runtime under node; the browser path is covered by the shim itself. */
expectOutput('printf', '#include <stdio.h>\nint main(){ printf("hi %d\\n", 42); return 0; }\n', 'hi 42\n');
expectOutput('scanf', '#include <stdio.h>\nint main(){ int a, b; scanf("%d %d", &a, &b); printf("%d\\n", a + b); return 0; }\n', '7\n', '3 4');

console.log(`\n${pass} passed, ${fail} failed.\n`);
process.exit(fail === 0 ? 0 : 1);
