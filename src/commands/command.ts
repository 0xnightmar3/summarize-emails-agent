export interface Command {
    name: string;
    matches(cmd: string): boolean;
    execute(args: string[]): Promise<void>;
}
