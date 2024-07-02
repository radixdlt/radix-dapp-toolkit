import { Logger as TsLogger } from 'tslog'

export type Logger = ReturnType<typeof Logger>
export const Logger = (minLevel?: number) =>
  new TsLogger({
    minLevel: minLevel ?? 2,
    prettyLogTemplate:
      '{{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{name}}\t{{logLevelName}}\t',
  })
