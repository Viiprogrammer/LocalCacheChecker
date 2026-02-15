namespace LocalCacheChecker.ApiModels
{

    internal class FranchiseModel
    {

        public string Id { get; set; } = "";

        public string Name { get; set; } = "";

        public string NameEnglish { get; set; } = "";

        public decimal? Rating { get; set; } = null;

        private int? _lastYear;
        public int LastYear
        {
            get => _lastYear ?? 0;
            set => _lastYear = value;
        }
    
        private int? _firstYear;
        public int FirstYear
        {
            get => _firstYear ?? 0;
            set => _firstYear = value;
        }

        public int TotalReleases { get; set; }

        public int TotalEpisodes { get; set; }

        public string TotalDuration { get; set; } = "";

        public int TotalDurationInSeconds { get; set; }

        public FranchiseImageModel Image { get; set; } = new FranchiseImageModel();

    }

}
