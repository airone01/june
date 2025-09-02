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
- Why does this exist? See right below.

## Why
The reasons are technical but boil down to:
- See "Storage Considerations".
- Simply using `chroot` requires root.
- AppImages requires a kernel module (and extracting them would be virtually the same as extracting tars from the GitHub releases of programs).
- `bwrap`, `groot` and others are already encapsulated inside of Junest.
- Making a package manager from scratch is at best long and tedious. Junest uses an ArchLinux namespace, meaning yay and AUR.

## What it does
- Keeps **Junest data permanently** in `~/sgoinfre`.
- On login, copies the data from `~/sgoinfre` → `/tmp` for fast local use (yes, the `tmp`, read "Storage Considerations").
- **goinfre** and **sgoinfre** are bind-mounted to the Junest env for ease of access.
- Any changes made in the environment is **propagated back to sgoinfre** (automatically or with the `sync` command).

## How It Works
- Junest provides:
- A separate environment for installing applications.
- Access to the **AUR**.
- Near-native execution speeds.
- June acts as a **wrapper** to simplify usage:
- Creates **shims**, so installed apps are accessible directly from the host system.
- Manages syncing between `volatile` (fast, temporary) and `sgoinfre` (persistent, slow).

## Storage Considerations
- Home storage is limited to **10GB** (too small for IDEs or large applications).
- The **goinfre** exists for fat storage, but its living time is unpredictable (can be removed anytime).
- **sgoinfre** has network-based, *virtually infinite* storage, but it's slow.
- So the solution was saving apps on **sgoinfre**, load them during session load to the **volatile** (volatile used to be `~/goinfre`, but we went with `/tmp` instead)
- Links to apps (custom script with env and all, called *shims*) are stored in **~/home/bin**.

## Future Plans
- Add a **startup script** to handle setup, syncing, and app launch automatically.
- Support **special patches** for specific applications that need extra configuration to run correctly:
- IDEs → prevent them from writing large amounts of data into `~/home`.
- Process monitors → handle `/proc` compatibility with Junest.
