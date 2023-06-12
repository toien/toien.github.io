# toien.github.io

toien's personal blog repo.

## Run

- Ruby 3.0 (Gem, Bundler)
- Node v11 

### Install

Install gemsets:
```shell
> bundler install
```

for building native extentions, openssl requirement is needed, Refer: [This](https://stackoverflow.com/questions/30818391/gem-eventmachine-fatal-error-openssl-ssl-h-file-not-found)

Install node dependencies:

```shell
> npm install
```

## Debug

In `_config.yml`, change `env` property to "develop" 

```shell
> jekyll serve -D -w
```

## Build (frontend)

```
> npm run css
> npm run js
```

Replace script/css references in html docs: `_include/head.html`
