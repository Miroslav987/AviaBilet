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
import { log } from "console";

const { RangePicker } = DatePicker;
const { Option } = Select;

// Локальный список аэропортов для автокомплита
const airports = [
  { label: "Москва (MOW)", value: "MOW" },
  { label: "Нью-Йорк (JFK)", value: "JFK" },
  { label: "Лондон (LON)", value: "LON" },
  { label: "Париж (PAR)", value: "PAR" },
  { label: "Токио (TYO)", value: "TYO" },
];

export default function DuffelFlights() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [roundTrip, setRoundTrip] = useState(false);
  const [form] = Form.useForm();

  // Опции для автокомплита
  const [fromOptions, setFromOptions] = useState(airports);
  const [toOptions, setToOptions] = useState(airports);

  const onSearchFrom = useMemo(
    () =>
      debounce((value: string) => {
        const filtered = airports.filter(
          (a) =>
            a.label.toLowerCase().includes(value.toLowerCase()) ||
            a.value.toLowerCase().includes(value.toLowerCase())
        );
        setFromOptions(filtered);
      }, 300),
    []
  );

  const onSearchTo = useMemo(
    () =>
      debounce((value: string) => {
        const filtered = airports.filter(
          (a) =>
            a.label.toLowerCase().includes(value.toLowerCase()) ||
            a.value.toLowerCase().includes(value.toLowerCase())
        );
        setToOptions(filtered);
      }, 300),
    []
  );

  const onFinish = async (values: any) => {
    const origin = values.from?.toUpperCase();
    if (!origin || origin.length !== 3) {
      message.error('Поле "Откуда" должно содержать 3-буквенный код IATA, например, MOW');
      return;
    }

    const destination = values.to?.toUpperCase();
    if (!destination || destination.length !== 3) {
      message.error('Поле "Куда" должно содержать 3-буквенный код IATA, например, JFK');
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
          origin,
          destination,
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
      setResults(data.data.offers || []);
      console.log(results);
      
    } catch (error) {
      message.error("Ошибка при запросе к API");
      console.error(error);
    }

    setLoading(false);
  };

  const renderItinerary = (itinerary: any, label: string) => {
    if (!itinerary || !itinerary.segments) return null;
    const departure = itinerary.segments[0].departure;
    const arrival = itinerary.segments[itinerary.segments.length - 1].arrival;

    return (
      <div key={label} style={{ marginBottom: 12 }}>
        <b>{label}</b>
        <Row style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Col>
            <p>Вылет:</p>
            <p>{departure.iataCode}</p>
            <p>{dayjs(departure.at).format("DD MMM YYYY, HH:mm")}</p>
          </Col>
          <Col style={{ fontSize: 24, fontWeight: "bold", alignSelf: "flex-end" }}>
            →
          </Col>
          <Col>
            <p>Прибытие:</p>
            <p>{arrival.iataCode}</p>
            <p>{dayjs(arrival.at).format("DD MMM YYYY, HH:mm")}</p>
          </Col>
        </Row>
      </div>
    );
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
                options={fromOptions}
                onSearch={onSearchFrom}
                onSelect={(value) => form.setFieldsValue({ from: value })}
                placeholder="IATA код или город (например MOW)"
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
                options={toOptions}
                onSearch={onSearchTo}
                onSelect={(value) => form.setFieldsValue({ to: value })}
                placeholder="IATA код или город (например JFK)"
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

          <Col span={3} style={{ display: "flex", alignItems: "end" }}>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Найти
              </Button>
            </Form.Item>
          </Col>
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
            const arr = slice.segments[slice.segments.length - 1]?.arriving_at;

            return (
              <div key={slice.id || i} style={{ marginBottom: 12 }}>
                <b>{i === 0 ? "Туда" : "Обратно"}</b>
                <Row style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <Col>
                    <p>Вылет: {slice.origin.iata_code}</p>
                    <p>{dep ? dayjs(dep).format("DD MMM YYYY, HH:mm") : "-"}</p>
                  </Col>
                  <Col style={{ fontSize: 24, fontWeight: "bold", alignSelf: "flex-end" }}>
                    →
                  </Col>
                  <Col>
                    <p>Прибытие: {slice.destination.iata_code}</p>
                    <p>{arr ? dayjs(arr).format("DD MMM YYYY, HH:mm") : "-"}</p>
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
