# append the following to .profile

################################## JUNE ##################################
if ! cat /etc/os-release | grep -qi "ID=arch"; then
  /usr/bin/gnome-terminal -- june-startup &
fi
##########################################################################

