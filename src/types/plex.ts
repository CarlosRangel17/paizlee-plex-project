export interface SectionsResponse {
    MediaContainer: MediaContainer;
}

export interface MediaContainer {
    size:                number;
    allowSync:           boolean;
    art:                 string;
    identifier:          string;
    librarySectionID:    number;
    librarySectionTitle: string;
    librarySectionUUID:  string;
    mediaTagPrefix:      string;
    mediaTagVersion:     number;
    thumb:               string;
    title1:              string;
    title2:              string;
    viewGroup:           ViewGroup;
    viewMode:            number;
    Metadata:            Metadatum[];
}

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
    thumb:                  string;
    art:                    string;
    duration:               number;
    originallyAvailableAt?: Date;
    addedAt:                number;
    updatedAt:              number;
    audienceRatingImage?:   AudienceRatingImage;
    chapterSource?:         ChapterSource;
    primaryExtraKey?:       string;
    ratingImage?:           RatingImage;
    Media:                  Media[];
    Image:                  Image[];
    UltraBlurColors?:       UltraBlurColors;
    Genre:                  Country[];
    Country:                Country[];
    Director:               Country[];
    Writer?:                Country[];
    Role:                   Country[];
    originalTitle?:         string;
    viewOffset?:            number;
    titleSort?:             string;
}

export interface Country {
    tag: string;
}

export interface Image {
    alt:  string;
    type: Type;
    url:  string;
}

export type Type = "coverPoster" | "background" | "clearLogo" | "backgroundSquare";

export interface Media {
    id:               number;
    duration?:        number;
    bitrate?:         number;
    width?:           number;
    height?:          number;
    aspectRatio?:     number;
    audioChannels?:   number;
    audioCodec?:      AudioCodec;
    videoCodec?:      VideoCodec;
    videoResolution?: string;
    container?:       Container;
    videoFrameRate?:  VideoFrameRate;
    videoProfile?:    VideoProfile;
    hasVoiceActivity: boolean;
    Part:             Part[];
    audioProfile?:    AudioProfile;
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

export type AudioProfile = "ma" | "lc" | "dts" | "dolby truehd + dolby atmos" | "pcm_s16le" | "es" | "dolby digital plus + dolby atmos" | "ma + dts:x" | "pcm_s24le";

export type Container = "mkv" | "mpegvideo";

export type VideoProfile = "main" | "high" | "main 10" | "advanced" | "high 10";

export type AudioCodec = "ac3" | "dca-ma" | "aac" | "dca" | "truehd" | "flac" | "pcm" | "eac3";

export type VideoCodec = "mpeg2video" | "h264" | "hevc" | "vc1";

export type VideoFrameRate = "NTSC" | "24p" | "PAL";

export interface UltraBlurColors {
    topLeft:     string;
    topRight:    string;
    bottomRight: string;
    bottomLeft:  string;
}

export type AudienceRatingImage = "rottentomatoes://image.rating.spilled" | "rottentomatoes://image.rating.upright" | "imdb://image.rating";

export type ChapterSource = "media";

export type ContentRating = "R" | "PG-13" | "G" | "Not Rated" | "PG" | "TV-MA" | "Approved" | "Passed" | "TV-14" | "TV-G" | "TV-PG";

export type RatingImage = "rottentomatoes://image.rating.ripe" | "rottentomatoes://image.rating.rotten";

export type ViewGroup = "movie";

