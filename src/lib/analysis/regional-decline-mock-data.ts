export const REGIONAL_DECLINE_MOCK_YEARS = [2021,2022,2023,2024,2025] as const;

export type RegionalDeclineCell = { index: number; grade: number } | null;

export type RegionalDeclineRow = {
  region: string;
  byYear: Record<number, RegionalDeclineCell>;
};

export const REGIONAL_DECLINE_MOCK_DATA: RegionalDeclineRow[] = [
  {
    "region": "서울",
    "byYear": {
      "2021": {
        "index": 94.99,
        "grade": 1
      },
      "2022": {
        "index": 89.56,
        "grade": 1
      },
      "2023": {
        "index": 84.78,
        "grade": 1
      },
      "2024": {
        "index": 80.34,
        "grade": 1
      },
      "2025": {
        "index": 75.8,
        "grade": 1
      }
    }
  },
  {
    "region": "부산",
    "byYear": {
      "2021": {
        "index": 60.83,
        "grade": 1
      },
      "2022": {
        "index": 56.18,
        "grade": 2
      },
      "2023": {
        "index": 51.99,
        "grade": 2
      },
      "2024": {
        "index": 48.29,
        "grade": 2
      },
      "2025": {
        "index": 44.78,
        "grade": 2
      }
    }
  },
  {
    "region": "대구",
    "byYear": {
      "2021": {
        "index": 70.13,
        "grade": 1
      },
      "2022": {
        "index": 64.53,
        "grade": 1
      },
      "2023": {
        "index": 58.72,
        "grade": 2
      },
      "2024": {
        "index": 54.56,
        "grade": 2
      },
      "2025": {
        "index": 50.6,
        "grade": 2
      }
    }
  },
  {
    "region": "인천",
    "byYear": {
      "2021": {
        "index": 91.31,
        "grade": 1
      },
      "2022": {
        "index": 84.28,
        "grade": 1
      },
      "2023": {
        "index": 78,
        "grade": 1
      },
      "2024": {
        "index": 72.39,
        "grade": 1
      },
      "2025": {
        "index": 66.9,
        "grade": 1
      }
    }
  },
  {
    "region": "광주",
    "byYear": {
      "2021": {
        "index": 90.66,
        "grade": 1
      },
      "2022": {
        "index": 84.59,
        "grade": 1
      },
      "2023": {
        "index": 78.15,
        "grade": 1
      },
      "2024": {
        "index": 72.02,
        "grade": 1
      },
      "2025": {
        "index": 65.93,
        "grade": 1
      }
    }
  },
  {
    "region": "대전",
    "byYear": {
      "2021": {
        "index": 89.14,
        "grade": 1
      },
      "2022": {
        "index": 82.97,
        "grade": 1
      },
      "2023": {
        "index": 77.51,
        "grade": 1
      },
      "2024": {
        "index": 72.62,
        "grade": 1
      },
      "2025": {
        "index": 67.68,
        "grade": 1
      }
    }
  },
  {
    "region": "울산",
    "byYear": {
      "2021": {
        "index": 88.74,
        "grade": 1
      },
      "2022": {
        "index": 78.5,
        "grade": 1
      },
      "2023": {
        "index": 69.63,
        "grade": 1
      },
      "2024": {
        "index": 62.32,
        "grade": 1
      },
      "2025": {
        "index": 55.93,
        "grade": 2
      }
    }
  },
  {
    "region": "세종",
    "byYear": {
      "2021": {
        "index": 139.22,
        "grade": 0
      },
      "2022": {
        "index": 129.29,
        "grade": 0
      },
      "2023": {
        "index": 119.31,
        "grade": 0
      },
      "2024": {
        "index": 110.33,
        "grade": 0
      },
      "2025": {
        "index": 101.78,
        "grade": 0
      }
    }
  },
  {
    "region": "경기",
    "byYear": {
      "2021": {
        "index": 97.65,
        "grade": 1
      },
      "2022": {
        "index": 90.42,
        "grade": 1
      },
      "2023": {
        "index": 83.33,
        "grade": 1
      },
      "2024": {
        "index": 77.16,
        "grade": 1
      },
      "2025": {
        "index": 71.05,
        "grade": 1
      }
    }
  },
  {
    "region": "강원",
    "byYear": {
      "2021": {
        "index": 47.9,
        "grade": 2
      },
      "2022": {
        "index": 44.5,
        "grade": 2
      },
      "2023": {
        "index": 41.32,
        "grade": 2
      },
      "2024": {
        "index": 38.37,
        "grade": 3
      },
      "2025": {
        "index": 35.36,
        "grade": 3
      }
    }
  },
  {
    "region": "충북",
    "byYear": {
      "2021": {
        "index": 60.25,
        "grade": 1
      },
      "2022": {
        "index": 55.65,
        "grade": 2
      },
      "2023": {
        "index": 51.66,
        "grade": 2
      },
      "2024": {
        "index": 48.29,
        "grade": 2
      },
      "2025": {
        "index": 45.06,
        "grade": 2
      }
    }
  },
  {
    "region": "충남",
    "byYear": {
      "2021": {
        "index": 55.81,
        "grade": 2
      },
      "2022": {
        "index": 51.99,
        "grade": 2
      },
      "2023": {
        "index": 48.7,
        "grade": 2
      },
      "2024": {
        "index": 45.97,
        "grade": 2
      },
      "2025": {
        "index": 43.06,
        "grade": 2
      }
    }
  },
  {
    "region": "전북",
    "byYear": {
      "2021": {
        "index": 47.52,
        "grade": 2
      },
      "2022": {
        "index": 44.38,
        "grade": 2
      },
      "2023": {
        "index": 41.51,
        "grade": 2
      },
      "2024": {
        "index": 38.91,
        "grade": 3
      },
      "2025": {
        "index": 36.23,
        "grade": 3
      }
    }
  },
  {
    "region": "전남",
    "byYear": {
      "2021": {
        "index": 39.41,
        "grade": 3
      },
      "2022": {
        "index": 36.96,
        "grade": 3
      },
      "2023": {
        "index": 34.71,
        "grade": 3
      },
      "2024": {
        "index": 32.67,
        "grade": 3
      },
      "2025": {
        "index": 30.64,
        "grade": 3
      }
    }
  },
  {
    "region": "경북",
    "byYear": {
      "2021": {
        "index": 43.54,
        "grade": 2
      },
      "2022": {
        "index": 40.02,
        "grade": 2
      },
      "2023": {
        "index": 37.14,
        "grade": 3
      },
      "2024": {
        "index": 34.17,
        "grade": 3
      },
      "2025": {
        "index": 31.43,
        "grade": 3
      }
    }
  },
  {
    "region": "경남",
    "byYear": {
      "2021": {
        "index": 59.01,
        "grade": 2
      },
      "2022": {
        "index": 53.16,
        "grade": 2
      },
      "2023": {
        "index": 48,
        "grade": 2
      },
      "2024": {
        "index": 43.75,
        "grade": 2
      },
      "2025": {
        "index": 39.92,
        "grade": 3
      }
    }
  },
  {
    "region": "제주",
    "byYear": {
      "2021": {
        "index": 73.67,
        "grade": 1
      },
      "2022": {
        "index": 68.56,
        "grade": 1
      },
      "2023": {
        "index": 63.27,
        "grade": 1
      },
      "2024": {
        "index": 58.35,
        "grade": 2
      },
      "2025": {
        "index": 53.35,
        "grade": 2
      }
    }
  }
];
