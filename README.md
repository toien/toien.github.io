# toien.github.io

toien's personal blog repo.

## Run

- Ruby 2.9.5 (RVM, Bundler, Refer:[GitHub Pages Dependency Versions](https://pages.github.com/versions/))
- Node v11 (fnm)

## Install

```shell
rvm install 2.7.4

rvm use 2.7.4

rvm gemset create gh_blog

rvm use 2.7.4@gh_blog

bundle install
```

Install node dependencies:

```shell
npm install
```

### Issues

- rvm install failed: [Error running '__rvm_make -j16'](https://github.com/rvm/rvm/issues/5146#issuecomment-1020961695)

## Debug

In `_config.yml`, change `env` property to `develop`

```shell
bundle exec jekyll serve -D -w
```

## Build (frontend)

```
> npm run css
> npm run js
```

Replace script/css references in html docs: `_include/head.html`
