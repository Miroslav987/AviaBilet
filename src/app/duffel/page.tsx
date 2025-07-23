"use client";

import React, { useState, useMemo } from "react";
import {
  Button,
  DatePicker,
  Form,
  InputNumber,
  List,
  Checkbox,
  Col,
  Row,
  AutoComplete,
  message,
  Select,
} from "antd";
import dayjs from "dayjs";
import debounce from "lodash.debounce";

const { RangePicker } = DatePicker;
const { Option } = Select;

const airports = [
  { city: "Москва", country: "Россия", code: "MOW" },
  { city: "Санкт-Петербург", country: "Россия", code: "LED" },
  { city: "Новосибирск", country: "Россия", code: "OVB" },
  { city: "Екатеринбург", country: "Россия", code: "SVX" },
  { city: "Казань", country: "Россия", code: "KZN" },
  { city: "Сочи", country: "Россия", code: "AER" },
  { city: "Красноярск", country: "Россия", code: "KJA" },
  { city: "Владивосток", country: "Россия", code: "VVO" },
  { city: "Уфа", country: "Россия", code: "UFA" },
  { city: "Самара", country: "Россия", code: "KUF" },

  { city: "Бишкек", country: "Кыргызстан", code: "FRU" },
  { city: "Ош", country: "Кыргызстан", code: "OSS" },
  { city: "Исфана", country: "Кыргызстан", code: "LYP" },
  { city: "Баткен", country: "Кыргызстан", code: "БТК" },
  { city: "Джалал-Абад", country: "Кыргызстан", code: "ДЖА" },
  { city: "Каракол", country: "Кыргызстан", code: "КРК" },
  { city: "Нарын", country: "Кыргызстан", code: "НРН" },
  { city: "Талас", country: "Кыргызстан", code: "ТЛС" },
  { city: "Кызыл-Кия", country: "Кыргызстан", code: "ККЯ" },

  { city: "Нью-Йорк", country: "США", code: "JFK" },
  { city: "Лондон", country: "Великобритания", code: "LON" },
  { city: "Париж", country: "Франция", code: "PAR" },
  { city: "Токио", country: "Япония", code: "TYO" },
];

// Опции для автокомплита показывают только города
const fromOptions = airports.map((a) => ({ value: a.city }));
const toOptions = airports.map((a) => ({ value: a.city }));

// Поиск по городу (фильтрация по названию города)
const filterAirportsByCity = (input: string) =>
  airports.filter((a) => a.city.toLowerCase().includes(input.toLowerCase()));

// Найти IATA код по названию города
const findCodeByCity = (city: string) => {
  const found = airports.find(
    (a) => a.city.toLowerCase() === city.toLowerCase()
  );
  return found ? found.code : null;
};

// Найти город по IATA коду
const findCityByCode = (code: string) => {
  const found = airports.find(
    (a) => a.code.toUpperCase() === code.toUpperCase()
  );
  return found ? found.city : code;
};

export default function DuffelFlights() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [roundTrip, setRoundTrip] = useState(false);
  const [form] = Form.useForm();

  const [fromAutoOptions, setFromAutoOptions] = useState(fromOptions);
  const [toAutoOptions, setToAutoOptions] = useState(toOptions);

  const onSearchFrom = useMemo(
    () =>
      debounce((value: string) => {
        const filtered = filterAirportsByCity(value).map((a) => ({
          value: a.city,
        }));
        setFromAutoOptions(filtered.length ? filtered : [{ value: value }]);
      }, 300),
    []
  );

  const onSearchTo = useMemo(
    () =>
      debounce((value: string) => {
        const filtered = filterAirportsByCity(value).map((a) => ({
          value: a.city,
        }));
        setToAutoOptions(filtered.length ? filtered : [{ value: value }]);
      }, 300),
    []
  );

  const today = new Date();

const ReadyFinish = async () => {
  const today = new Date();

  function formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  const departureDate = formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000));
  const returnDate = formatDate(new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000));

  // Автозаполняем форму
  setRoundTrip(true);
  form.setFieldsValue({
    from: "Москва",
    to: "Бишкек",
    travelClass: "ECONOMY",
    adults: 1,
    rangePicker: [dayjs(departureDate), dayjs(returnDate)],
  });

  setLoading(true);

  try {
    const res = await fetch("/api/searchDuffel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: "MOW",
        destination: "FRU",
        departureDate,
        returnDate,
        adults: 1,
        cabinClass: "ECONOMY",
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      message.error(errData.error || "Ошибка при поиске билетов");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setResults(data.data?.offers || []);
  } catch (error) {
    message.error("Ошибка при запросе к API");
    console.error(error);
  }
  setLoading(false);
};

  const onFinish = async (values: any) => {
    // Получаем коды IATA из выбранных городов
    const originCode = findCodeByCity(values.from);
    const destinationCode = findCodeByCity(values.to);

    if (!originCode) {
      message.error("Неизвестный город отправления, выберите из списка.");
      return;
    }
    if (!destinationCode) {
      message.error("Неизвестный город назначения, выберите из списка.");
      return;
    }

    let departureDate = "";
    let returnDate = undefined;

    if (roundTrip) {
      if (!values.rangePicker || values.rangePicker.length !== 2) {
        message.error("Пожалуйста, выберите даты отправления и возвращения");
        return;
      }
      departureDate = values.rangePicker[0].format("YYYY-MM-DD");
      returnDate = values.rangePicker[1].format("YYYY-MM-DD");

      if (dayjs(returnDate).isBefore(dayjs(departureDate))) {
        message.error("Дата возвращения должна быть позже даты отправления.");
        return;
      }
    } else {
      if (!values.departureDate) {
        message.error("Пожалуйста, выберите дату отправления");
        return;
      }
      departureDate = values.departureDate.format("YYYY-MM-DD");
    }

    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/searchDuffel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: originCode,
          destination: destinationCode,
          departureDate,
          returnDate,
          adults: values.adults || 1,
          cabinClass: values.travelClass?.toUpperCase() || "ECONOMY",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        message.error(errData.error || "Ошибка при поиске билетов");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResults(data.data?.offers || []);
    } catch (error) {
      message.error("Ошибка при запросе к API");
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 48, maxWidth: 900, margin: "auto" }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="from"
              label="Откуда"
              rules={[{ required: true, message: "Введите город отправления" }]}
            >
              <AutoComplete
                options={fromAutoOptions}
                onSearch={onSearchFrom}
                placeholder="Начните ввод города"
                filterOption={false}
                allowClear
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="to"
              label="Куда"
              rules={[{ required: true, message: "Введите город назначения" }]}
            >
              <AutoComplete
                options={toAutoOptions}
                onSearch={onSearchTo}
                placeholder="Начните ввод города"
                filterOption={false}
                allowClear
              />
            </Form.Item>
          </Col>

          <Col span={3} style={{ display: "flex", alignItems: "center" }}>
            <Form.Item>
              <Checkbox
                checked={roundTrip}
                onChange={(e) => {
                  setRoundTrip(e.target.checked);
                  form.resetFields(["departureDate", "rangePicker"]);
                }}
              >
                Туда и обратно
              </Checkbox>
            </Form.Item>
          </Col>

          <Col span={9}>
            <Form.Item
              name={roundTrip ? "rangePicker" : "departureDate"}
              label="Даты поездки"
              rules={[{ required: true, message: "Пожалуйста, выберите дату" }]}
            >
              {roundTrip ? (
                <RangePicker format="YYYY-MM-DD" />
              ) : (
                <DatePicker format="YYYY-MM-DD" />
              )}
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="travelClass"
              label="Класс перелёта"
              initialValue="ECONOMY"
              rules={[{ required: true, message: "Выберите класс перелёта" }]}
            >
              <Select>
                <Option value="ECONOMY">Эконом</Option>
                <Option value="BUSINESS">Бизнес</Option>
                <Option value="FIRST">Первый</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={3}>
            <Form.Item
              name="adults"
              label="Взрослые"
              initialValue={1}
              rules={[{ type: "number", min: 1 }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Row >
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Найти
              </Button>
              <Button style={{ marginLeft:10}} type="primary" onClick={ReadyFinish} loading={loading2}>
                готовый запрос
              </Button>
            </Form.Item>
          </Row>
        </Row>
      </Form>

      <List
        header={<b>Результаты поиска</b>}
        bordered
        style={{ marginTop: 20 }}
        dataSource={results}
        renderItem={(offer, index) => {
          if (!offer || !offer.slices) return null;

          return (
            <List.Item key={index}>
              <div style={{ width: "100%" }}>
                {offer.slices.map((slice: any, i: number) => {
                  const dep = slice.segments[0]?.departing_at;
                  const arr =
                    slice.segments[slice.segments.length - 1]?.arriving_at;

                  return (
                    <div key={slice.id || i} style={{ marginBottom: 12 }}>
                      <b>{i === 0 ? "Туда" : "Обратно"}</b>
                      <Row
                        style={{
                          display: "flex",
                          gap: 20,
                          alignItems: "center",
                        }}
                      >
                        <Col>
                          <p>Вылет: {findCityByCode(slice.origin.iata_code)}</p>
                          <p>
                            {dep
                              ? dayjs(dep).format("DD MMM YYYY, HH:mm")
                              : "-"}
                          </p>
                        </Col>
                        <Col
                          style={{
                            fontSize: 24,
                            fontWeight: "bold",
                            alignSelf: "flex-end",
                          }}
                        >
                          →
                        </Col>
                        <Col>
                          <p>
                            Прибытие:{" "}
                            {findCityByCode(slice.destination.iata_code)}
                          </p>
                          <p>
                            {arr
                              ? dayjs(arr).format("DD MMM YYYY, HH:mm")
                              : "-"}
                          </p>
                        </Col>
                      </Row>
                    </div>
                  );
                })}

                <Row justify="end" style={{ fontWeight: "bold" }}>
                  Цена: {offer.total_amount} {offer.total_currency}
                </Row>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
