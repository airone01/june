<h1 align="center">
  <img src="/.github/assets/logo.svg">
</h1>

<p align="center">
  <i align="center">User-space package manager</i> for students of 42 Lyon
</p>

<h4 align="center">
  <a href="https://profile.intra.42.fr/users/elagouch"><img alt="School 42 badge" src="https://img.shields.io/badge/-elagouch-020617?labelColor=020617&color=5a45fe&logo=42"></a>
  <img alt="MIT license" src="https://img.shields.io/badge/License-MIT-ef00c7?logo=creativecommons&logoColor=fff&labelColor=020617">
  <img alt="Made in Shell" src="https://img.shields.io/badge/Made_in-Shell-ff2b89?logo=gnubash&logoColor=fff&labelColor=020617">
  <img alt="Package version" src="https://img.shields.io/github/v/release/airone01/june?logo=gnubash&logoColor=fff&label=Version&labelColor=020617&color=ff8059">
  <img alt="GitHub contributors" src="https://img.shields.io/github/contributors-anon/airone01/june?logo=github&labelColor=020617&color=ffc248&label=Contributors">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/airone01/june?logo=github&labelColor=020617&color=f9f871&label=Last%20commit">
</h4>

## Overview

- **June** exists to solve the lack of proper package managers for a group of in 42 Lyon Auvergne-Rhône-Alpes.
- The goal is to provide a way to install and run applications without requiring `sudo` or admin rights.
- June wraps around **Junest** to provide a convenient workflow in this restricted environment.
- Why does this exist? See the "Why" section.

## Installation

Install script is planned out, for now this is v0 so bear with me :-)

1. Install [junest](https://github.com/fsquillace/junest)! You can do that by pasting the following command in your terminal `git clone https://github.com/fsquillace/junest.git ~/.local/share/junest`, and adding `export PATH=~/.local/share/junest/bin:$PATH` to your `.bashrc`, `.zshrc`, ...
2. Add the content of the [`.profile`](./.profile) file of this repo to your own `.profile` (not `.bashrc` or `.bash_profile`, etc... !).
3. Restart your shell.
4. Run `june startup`.

After the installation, you will be able to install packages with `june install <pkgs>`, and they will be available in your PATH.

## Usage

Run `june -h` :-)

## Details

### Why

The reasons are technical but boil down to:
- See "Storage Considerations".
- Simply using `chroot` requires root.
- AppImages requires a kernel module (and extracting them would be virtually the same as extracting tars from the GitHub releases of programs).
- `bwrap`, `groot` and others are already encapsulated inside of Junest.
- Making a package manager from scratch is at best long and tedious. Junest uses an ArchLinux namespace, meaning yay and AUR.

### What it does

- Keeps **Junest data permanently** in the persistent storage.
- On login, copies the data from `~/sgoinfre` → `/tmp` for fast local use (yes, the `tmp`, read "Storage Considerations").
- **goinfre** and **sgoinfre** are bind-mounted to the Junest env for ease of access.
- Any changes made in the environment is **propagated back to the persistent storage** (automatically or with the `sync` command).

### How It Works

- Junest provides:
- A separate environment for installing applications.
- Access to the **AUR**.
- Near-native execution speeds.
- June acts as a **wrapper** to simplify usage:
- Creates **shims**, so installed apps are accessible directly from the host system.
- Manages syncing between `volatile` (fast, temporary) and `persistent` (slow).

### Storage Considerations

- Home storage is limited to **10GB** (too small for IDEs or large applications).
- The **goinfre** (and the `/tmp` dir as well) exists for fat storage, but its living time is unpredictable (can be removed anytime). __This was used for the volatile storage**.
- **sgoinfre** has network-based, *virtually infinite* storage, but it's slow. __This is used for the persistent storage**.
- So the solution was saving apps on **sgoinfre**, load them during session load to the **volatile** (volatile used to be `~/goinfre`, but we went with `/tmp` instead).
- We compress and copy the `.junest` dir to "save/load apps".
- Wrappers to apps (custom script with env and all, called *shims*) are stored in **~/home/bin**.

### Future Plans

- Add a **startup script** to handle setup, syncing, and app launch automatically.
- Support **special patches** for specific applications that need extra configuration to run correctly:
- IDEs → prevent them from writing large amounts of data into `~/home`.
  - In general find a way to avoid apps taking too much freedom of space.
  - This is what `bwrap` is for, but because we bind-mount HOME, apps can write there and fill the disk (looking at you, Android Studio).
  - One solution would be to have special patches with different bind-mounts when installing apps, but require special cases, so more work.
  - This is probably what we'll be going with anyways
- Process monitors → handle `/proc` compatibility with Junest.
