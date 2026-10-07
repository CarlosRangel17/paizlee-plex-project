# Pins (POST)
curl --location 'https://plex.tv/api/v2/pins' \
--header 'Accept: application/json' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'X-Plex-Product=PaizleePlexProject' \
--data-urlencode 'X-Plex-Client-Identifier=Paizlee-Plex-Project-MacBook-Client'

# Sections
curl --location 'http://192.168.1.100:32400/library/sections/2/all' \
--header 'Accept: application/json' \
--header 'X-Plex-Token: 7hsSyAZmUAyxpdz-kZvF'

# Media Providers
curl --location 'http://192.168.1.100:32400/media/providers' \
--header 'Accept: application/json' \
--header 'X-Plex-Token: 7hsSyAZmUAyxpdz-kZvF'