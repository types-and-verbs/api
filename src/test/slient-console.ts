export function slientConsole(disable = false): void {
  if (disable) return;
  const consoleBackup = console;

  beforeAll(() => {
    console.log = () => 'asdf';
    console.error = () => 'asdf';
  });

  afterAll(() => {
    console.log = consoleBackup.log;
    console.error = consoleBackup.error;
  });
}

