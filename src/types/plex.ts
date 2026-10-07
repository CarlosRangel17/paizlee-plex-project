// Plex Media Server JSON shapes.
// Generated from `GET /library/sections/2/all`, then widened so the same
// interfaces also cover TV libraries (`show`) and episode lists (`allLeaves`).
// Plex omits empty tag arrays and Media on non-playable items, so those are optional.

export interface PlexResponse<C> {
    MediaContainer: C;
}

export type SectionsResponse = PlexResponse<MediaContainer>;
export type LibraryResponse = PlexResponse<MediaContainer>;
export type LibrarySectionsResponse = PlexResponse<LibrarySectionsContainer>;

export interface MediaContainer {
    size:                 number;
    allowSync?:           boolean;
    art?:                 string;
    identifier?:          string;
    librarySectionID?:    number;
    librarySectionTitle?: string;
    librarySectionUUID?:  string;
    mediaTagPrefix?:      string;
    mediaTagVersion?:     number;
    thumb?:               string;
    title1?:              string;
    title2?:              string;
    viewGroup?:           ViewGroup;
    viewMode?:            number;
    Metadata?:            Metadatum[];
}

export interface LibrarySectionsContainer {
    size:       number;
    title1?:    string;
    Directory?: LibrarySection[];
}

export interface LibrarySection {
    key:       string;
    type:      LibraryType;
    title:     string;
    agent?:    string;
    scanner?:  string;
    language?: string;
    uuid?:     string;
    art?:      string;
    thumb?:    string;
}

export type LibraryType = "movie" | "show" | "artist" | "photo";

export interface Metadatum {
    ratingKey:              string;
    key:                    string;
    guid:                   string;
    slug?:                  string;
    studio?:                string;
    type:                   ViewGroup;
    title:                  string;
    contentRating?:         ContentRating;
    contentRatingAge?:      number;
    summary:                string;
    rating?:                number;
    audienceRating?:        number;
    viewCount?:             number;
    skipCount?:             number;
    lastViewedAt?:          number;
    year?:                  number;
    tagline?:               string;
    thumb?:                 string;
    art?:                   string;
    duration?:              number;
    /** ISO date string, e.g. "2002-11-08". */
    originallyAvailableAt?: string;
    addedAt:                number;
    updatedAt?:             number;
    audienceRatingImage?:   AudienceRatingImage;
    chapterSource?:         ChapterSource;
    primaryExtraKey?:       string;
    ratingImage?:           RatingImage;
    Media?:                 Media[];
    Image?:                 Image[];
    UltraBlurColors?:       UltraBlurColors;
    Genre?:                 Tag[];
    Country?:               Tag[];
    Director?:              Tag[];
    Writer?:                Tag[];
    Role?:                  Tag[];
    Collection?:            Tag[];
    originalTitle?:         string;
    viewOffset?:            number;
    titleSort?:             string;

    // Show / season / episode fields
    index?:                 number;
    parentIndex?:           number;
    parentRatingKey?:       string;
    parentTitle?:           string;
    grandparentRatingKey?:  string;
    grandparentTitle?:      string;
    grandparentThumb?:      string;
    grandparentArt?:        string;
    leafCount?:             number;
    viewedLeafCount?:       number;
    childCount?:            number;
}

export interface Tag {
    tag: string;
}

/** @deprecated Generated name for every tag array; use `Tag`. */
export type Country = Tag;

export interface Image {
    alt:  string;
    type: Type;
    url:  string;
}

export type Type = "coverPoster" | "background" | "clearLogo" | "backgroundSquare";

export interface Media {
    id:                number;
    duration?:         number;
    bitrate?:          number;
    width?:            number;
    height?:           number;
    aspectRatio?:      number;
    audioChannels?:    number;
    audioCodec?:       AudioCodec;
    videoCodec?:       VideoCodec;
    videoResolution?:  string;
    container?:        Container;
    videoFrameRate?:   VideoFrameRate;
    videoProfile?:     VideoProfile;
    hasVoiceActivity?: boolean;
    Part:              Part[];
    audioProfile?:     AudioProfile;
}

export interface Part {
    id:            number;
    key:           string;
    duration?:     number;
    file:          string;
    size:          number;
    container?:    Container;
    videoProfile?: VideoProfile;
    audioProfile?: AudioProfile;
    hasThumbnail?: string;
}

// Known values from the library scan, kept open-ended so new server values still type-check.
type Open<T extends string> = T | (string & {});

export type AudioProfile = Open<"ma" | "lc" | "dts" | "dolby truehd + dolby atmos" | "pcm_s16le" | "es" | "dolby digital plus + dolby atmos" | "ma + dts:x" | "pcm_s24le">;

export type Container = Open<"mkv" | "mpegvideo" | "mp4">;

export type VideoProfile = Open<"main" | "high" | "main 10" | "advanced" | "high 10">;

export type AudioCodec = Open<"ac3" | "dca-ma" | "aac" | "dca" | "truehd" | "flac" | "pcm" | "eac3">;

export type VideoCodec = Open<"mpeg2video" | "h264" | "hevc" | "vc1">;

export type VideoFrameRate = Open<"NTSC" | "24p" | "PAL">;

export interface UltraBlurColors {
    topLeft:     string;
    topRight:    string;
    bottomRight: string;
    bottomLeft:  string;
}

export type AudienceRatingImage = Open<"rottentomatoes://image.rating.spilled" | "rottentomatoes://image.rating.upright" | "imdb://image.rating">;

export type ChapterSource = Open<"media">;

export type ContentRating = Open<"R" | "PG-13" | "G" | "Not Rated" | "PG" | "TV-MA" | "Approved" | "Passed" | "TV-14" | "TV-G" | "TV-PG">;

export type RatingImage = Open<"rottentomatoes://image.rating.ripe" | "rottentomatoes://image.rating.rotten">;

export type ViewGroup = "movie" | "show" | "season" | "episode";
