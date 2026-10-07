import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export default function OwnerEarnings() {

  const navigate = useNavigate();

  const [earnings, setEarnings] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const currentDate =
    new Date();

  const [reportMonth, setReportMonth] =
    useState(
      currentDate.getMonth() + 1
    );

  const [reportYear, setReportYear] =
    useState(
      currentDate.getFullYear()
    );

  const [reportLoading, setReportLoading] =
    useState('');


  // ==========================================================
  // FETCH OWNER EARNINGS
  // ==========================================================

  const fetchEarnings = async () => {

    try {

      setLoading(true);
      setError('');

      const response =
        await API.get(
          '/payments/owner/earnings'
        );

      setEarnings(
        response.data.data
      );

    } catch (error) {

      console.error(
        'Failed to load earnings:',
        error
      );

      setError(
        error.response?.data?.message ||
        'Failed to load earnings'
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    fetchEarnings();
  }, []);


  // ==========================================================
  // DOWNLOAD STATION PDF
  // ==========================================================

  const downloadReport = async (
    type,
    stationId,
    stationName
  ) => {

    try {

      setReportLoading(
        `${type}-${stationId}`
      );


      const params =
        new URLSearchParams({
          type,
          year: String(reportYear),
          stationId: String(stationId)
        });


      // Monthly report needs month
      if (type === 'monthly') {

        params.set(
          'month',
          String(reportMonth)
        );
      }


      const response =
        await API.get(
          `/payments/owner/earnings/pdf?${params.toString()}`,
          {
            responseType: 'blob'
          }
        );


      const blob =
        new Blob(
          [response.data],
          {
            type: 'application/pdf'
          }
        );


      const url =
        window.URL.createObjectURL(
          blob
        );


      const link =
        document.createElement('a');


      const safeStationName =
        String(
          stationName ||
          'station'
        )
          .replace(
            /[^a-z0-9]+/gi,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          )
          .toLowerCase();


      link.href = url;


      link.download =
        type === 'monthly'
          ? `VoltFlow-${safeStationName}-monthly-earnings-${reportYear}-${String(reportMonth).padStart(2, '0')}.pdf`
          : `VoltFlow-${safeStationName}-yearly-earnings-${reportYear}.pdf`;


      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );

    } catch (error) {

      console.error(
        'PDF generation failed:',
        error
      );

      alert(
        error.response?.data?.message ||
        'Failed to generate PDF'
      );

    } finally {

      setReportLoading('');

    }
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div
        style={{
          maxWidth: '900px',
          margin: '50px auto',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}
      >

        <h2>
          Loading Earnings...
        </h2>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (
      <div
        style={{
          maxWidth: '900px',
          margin: '50px auto',
          padding: '20px',
          fontFamily: 'sans-serif'
        }}
      >

        <h2
          style={{
            color: '#dc2626'
          }}
        >
          Unable to Load Earnings
        </h2>

        <p>
          {error}
        </p>


        <button
          onClick={fetchEarnings}
          style={{
            padding: '10px 18px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            marginRight: '10px'
          }}
        >
          Try Again
        </button>


        <button
          onClick={() =>
            navigate(
              '/owner-dashboard'
            )
          }
          style={{
            padding: '10px 18px',
            background: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Back to Dashboard
        </button>

      </div>
    );
  }


  const stations =
    earnings?.stations || [];


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div
      style={{
        maxWidth: '1100px',
        margin: '30px auto',
        fontFamily: 'sans-serif',
        padding: '0 20px'
      }}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}
      >

        <div>

          <h2
            style={{
              margin: 0,
              color: '#0f172a'
            }}
          >
            Owner Earnings
          </h2>

          <p
            style={{
              color: '#64748b',
              marginTop: '8px'
            }}
          >
            View earnings separately for each
            charging station and download
            monthly or yearly reports.
          </p>

        </div>


        <button
          onClick={() =>
            navigate(
              '/owner-dashboard'
            )
          }
          style={{
            padding: '10px 18px',
            background: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ← Back to Dashboard
        </button>

      </div>


      {/* =====================================================
          OWNER SUMMARY
      ====================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}
      >

        {/* Total Earnings */}

        <div
          style={{
            padding: '25px',
            borderRadius: '10px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe'
          }}
        >

          <p
            style={{
              margin: 0,
              color: '#475569',
              fontSize: '0.9rem'
            }}
          >
            Total Owner Earnings
          </p>

          <h2
            style={{
              margin: '10px 0 0 0',
              color: '#2563eb',
              fontSize: '2rem'
            }}
          >
            ₹
            {Number(
              earnings?.totalEarnings || 0
            ).toFixed(2)}
          </h2>

        </div>


        {/* Completed Bookings */}

        <div
          style={{
            padding: '25px',
            borderRadius: '10px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0'
          }}
        >

          <p
            style={{
              margin: 0,
              color: '#475569',
              fontSize: '0.9rem'
            }}
          >
            Completed Bookings
          </p>

          <h2
            style={{
              margin: '10px 0 0 0',
              color: '#16a34a',
              fontSize: '2rem'
            }}
          >
            {earnings?.totalCompletedBookings || 0}
          </h2>

        </div>


        {/* Completed Payments */}

        <div
          style={{
            padding: '25px',
            borderRadius: '10px',
            background: '#fefce8',
            border: '1px solid #fde68a'
          }}
        >

          <p
            style={{
              margin: 0,
              color: '#475569',
              fontSize: '0.9rem'
            }}
          >
            Completed Payments
          </p>

          <h2
            style={{
              margin: '10px 0 0 0',
              color: '#ca8a04',
              fontSize: '2rem'
            }}
          >
            {earnings?.totalPaidBookings || 0}
          </h2>

        </div>

      </div>


      {/* =====================================================
          REPORT PERIOD
      ====================================================== */}

      <div
        style={{
          border:
            '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '25px',
          background: '#fff'
        }}
      >

        <h3
          style={{
            marginTop: 0
          }}
        >
          Report Period
        </h3>


        <div
          style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'end',
            flexWrap: 'wrap'
          }}
        >

          {/* Month */}

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontWeight: '600'
            }}
          >

            Month

            <select
              value={reportMonth}
              onChange={e =>
                setReportMonth(
                  Number(
                    e.target.value
                  )
                )
              }
              style={{
                padding: '9px',
                borderRadius: '6px',
                border:
                  '1px solid #cbd5e1'
              }}
            >

              {MONTHS.map(
                (monthName, index) => (

                  <option
                    key={monthName}
                    value={index + 1}
                  >
                    {monthName}
                  </option>

                )
              )}

            </select>

          </label>


          {/* Year */}

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontWeight: '600'
            }}
          >

            Year

            <input
              type="number"
              min="2000"
              max="2100"
              value={reportYear}
              onChange={e =>
                setReportYear(
                  Number(
                    e.target.value
                  )
                )
              }
              style={{
                padding: '9px',
                borderRadius: '6px',
                border:
                  '1px solid #cbd5e1',
                width: '120px'
              }}
            />

          </label>

        </div>

      </div>


      {/* =====================================================
          STATIONS
      ====================================================== */}

      {stations.length === 0 ? (

        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            border:
              '1px solid #cbd5e1',
            borderRadius: '10px',
            color: '#64748b'
          }}
        >

          <h3>
            No Stations Found
          </h3>

          <p>
            No charging stations are
            currently associated with
            your owner account.
          </p>

        </div>

      ) : (

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >

          {stations.map(
            station => (

              <div
                key={String(
                  station.stationId
                )}
                style={{
                  border:
                    '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '25px',
                  background: '#fff'
                }}
              >

                {/* Station Header */}

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: '20px',
                    flexWrap: 'wrap',
                    marginBottom: '20px'
                  }}
                >

                  <div>

                    <h3
                      style={{
                        margin:
                          '0 0 8px 0',
                        color: '#0f172a'
                      }}
                    >
                      {station.stationName ||
                        'Unnamed Station'}
                    </h3>

                    <p
                      style={{
                        margin: '5px 0',
                        color: '#64748b'
                      }}
                    >
                      {station.address ||
                        'Address not available'}
                    </p>

                    <p
                      style={{
                        margin: '5px 0',
                        color: '#64748b'
                      }}
                    >
                      Operating Hours:{' '}
                      {station.openingTime ||
                        '-'}{' '}
                      -{' '}
                      {station.closingTime ||
                        '-'}
                    </p>

                  </div>


                  {/* Station Earnings */}

                  <div
                    style={{
                      textAlign: 'right'
                    }}
                  >

                    <p
                      style={{
                        margin: 0,
                        color: '#64748b',
                        fontSize:
                          '0.9rem'
                      }}
                    >
                      Station Earnings
                    </p>

                    <h2
                      style={{
                        margin:
                          '5px 0',
                        color: '#2563eb'
                      }}
                    >
                      ₹
                      {Number(
                        station.totalEarnings ||
                        0
                      ).toFixed(2)}
                    </h2>

                  </div>

                </div>


                {/* Station Statistics */}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px'
                  }}
                >

                  <div
                    style={{
                      padding: '15px',
                      background:
                        '#f8fafc',
                      borderRadius: '7px'
                    }}
                  >

                    <div
                      style={{
                        color: '#64748b',
                        fontSize:
                          '0.85rem'
                      }}
                    >
                      Completed Payments
                    </div>

                    <strong>
                      {station.totalPayments ||
                        0}
                    </strong>

                  </div>


                  <div
                    style={{
                      padding: '15px',
                      background:
                        '#f8fafc',
                      borderRadius: '7px'
                    }}
                  >

                    <div
                      style={{
                        color: '#64748b',
                        fontSize:
                          '0.85rem'
                      }}
                    >
                      Completed Bookings
                    </div>

                    <strong>
                      {station.totalCompletedBookings ||
                        0}
                    </strong>

                  </div>

                </div>


                {/* Download Buttons */}

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    borderTop:
                      '1px solid #e2e8f0',
                    paddingTop: '20px'
                  }}
                >

                  {/* Monthly PDF */}

                  <button
                    onClick={() =>
                      downloadReport(
                        'monthly',
                        station.stationId,
                        station.stationName
                      )
                    }
                    disabled={
                      Boolean(
                        reportLoading
                      )
                    }
                    style={{
                      padding:
                        '11px 18px',
                      background:
                        '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius:
                        '6px',
                      cursor:
                        reportLoading
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight:
                        '600',
                      opacity:
                        reportLoading
                          ? 0.7
                          : 1
                    }}
                  >

                    {reportLoading ===
                    `monthly-${station.stationId}`
                      ? 'Generating...'
                      : 'Download Monthly PDF'}

                  </button>


                  {/* Yearly PDF */}

                  <button
                    onClick={() =>
                      downloadReport(
                        'yearly',
                        station.stationId,
                        station.stationName
                      )
                    }
                    disabled={
                      Boolean(
                        reportLoading
                      )
                    }
                    style={{
                      padding:
                        '11px 18px',
                      background:
                        '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius:
                        '6px',
                      cursor:
                        reportLoading
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight:
                        '600',
                      opacity:
                        reportLoading
                          ? 0.7
                          : 1
                    }}
                  >

                    {reportLoading ===
                    `yearly-${station.stationId}`
                      ? 'Generating...'
                      : 'Download Yearly PDF'}

                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}


      {/* =====================================================
          REFRESH
      ====================================================== */}

      <div
        style={{
          marginTop: '25px',
          textAlign: 'center'
        }}
      >

        <button
          onClick={fetchEarnings}
          style={{
            padding: '10px 20px',
            background: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🔄 Refresh Earnings
        </button>

      </div>

    </div>
  );
}