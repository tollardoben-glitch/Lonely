# Lonely

## Trader skills

This repo has the [trader-skill](https://github.com/Jakeschincariol/trader-skill) pack (v1.0, MIT, by Jake Schincariol)
installed as project-local Claude Code skills in `.claude/skills/`:

`/trader-copycat` `/trader-news` `/trader-budget` `/trader-pelosi` `/trader-analyst` `/trader-screener`
`/trader-risk` `/trader-broker` `/trader-tax` `/trader-alerts` `/trader-rebalance`

- The tools need Python 3.8 or newer and only the standard library.
- SEC requires a contact string. Set `SEC_USER_AGENT="Your Name you@example.com"` or put
  `"sec_user_agent"` in `trader/config.json`.
- Working data goes in `trader/`, which is git-ignored so your portfolio and orders stay private.
- `.claude/settings.json` makes Claude ask before it calls any Alpaca tool that places or changes an
  order, and blocks options, crypto and "close/cancel all" tools.

Not financial advice. Paper trading is the default.
