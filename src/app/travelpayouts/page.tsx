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
  { label: "Москва (MOW)", value: "MOW" },
  { label: "Санкт-Петербург (LED)", value: "LED" },
  { label: "Новосибирск (OVB)", value: "OVB" },
  { label: "Екатеринбург (SVX)", value: "SVX" },
  { label: "Казань (KZN)", value: "KZN" },
  { label: "Сочи (AER)", value: "AER" },
  { label: "Красноярск (KJA)", value: "KJA" },
  { label: "Владивосток (VVO)", value: "VVO" },
  { label: "Уфа (UFA)", value: "UFA" },
  { label: "Самара (KUF)", value: "KUF" },

  { label: "Бишкек (FRU)", value: "FRU" },
  { label: "Ош (OSS)", value: "OSS" },
  { label: "Исфана (LYP)", value: "LYP" },
  { label: "Баткен (БТК)", value: "БТК" },
  { label: "Джалал-Абад (ДЖА)", value: "ДЖА" },
  { label: "Каракол (КРК)", value: "КРК" },
  { label: "Нарын (НРН)", value: "НРН" },
  { label: "Талас (ТЛС)", value: "ТЛС" },
  { label: "Кызыл-Кия (ККЯ)", value: "ККЯ" },

  { label: "Нью-Йорк (JFK)", value: "JFK" },
  { label: "Лондон (LON)", value: "LON" },
  { label: "Париж (PAR)", value: "PAR" },
  { label: "Токио (TYO)", value: "TYO" },
];

// Получить label по коду
const getLabelByCode = (code: string) => {
  const found = airports.find(
    (airport) => airport.value.toUpperCase() === code.toUpperCase()
  );
  return found ? found.label : code;
};

export default function TravelpayoutsFlights() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);
  const [roundTrip, setRoundTrip] = useState(false);
  const [form] = Form.useForm();

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

  // При выборе опции в AutoComplete сохраняем в форму не label, а value (код)
  const onSelectFrom = (value: string) => {
    form.setFieldsValue({ from: value });
  };
  const onSelectTo = (value: string) => {
    form.setFieldsValue({ to: value });
  };

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
      const res = await fetch("/api/searchTravelpayouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: "MOW",
          destination: "FRU",
          departureDate,
          returnDate,
          adults: 1,
          travelClass: "ECONOMY",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        message.error(errData.error || "Ошибка при поиске билетов");
        setLoading(false);
        return;
      }
  
      const data = await res.json();
       setResults(data.data || []);
    } catch (error) {
      message.error("Ошибка при запросе к API");
      console.error(error);
    }
    setLoading(false);
  };

  const onFinish = async (values: any) => {
    const origin = values.from?.toUpperCase();
    if (!origin || origin.length !== 3) {
      message.error(
        'Поле "Откуда" должно содержать 3-буквенный код IATA, например, MOW'
      );
      return;
    }

    const destination = values.to?.toUpperCase();
    if (!destination || destination.length !== 3) {
      message.error(
        'Поле "Куда" должно содержать 3-буквенный код IATA, например, JFK'
      );
      return;
    }

    let departDate = "";
    let returnDate = undefined;

    if (roundTrip) {
      if (!values.rangePicker || values.rangePicker.length !== 2) {
        message.error("Пожалуйста, выберите даты отправления и возвращения");
        return;
      }
      departDate = values.rangePicker[0].format("YYYY-MM-DD");
      returnDate = values.rangePicker[1].format("YYYY-MM-DD");

      if (dayjs(returnDate).isBefore(dayjs(departDate))) {
        message.error("Дата возвращения должна быть позже даты отправления.");
        return;
      }
    } else {
      if (!values.departureDate) {
        message.error("Пожалуйста, выберите дату отправления");
        return;
      }
      departDate = values.departureDate.format("YYYY-MM-DD");
    }

    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/searchTravelpayouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          departureDate: departDate,
          returnDate,
          adults: values.adults,
          travelClass: values.travelClass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || "Ошибка при поиске билетов");
        setLoading(false);
        return;
      }

      setResults(data.data || []);
    } catch (e: any) {
      console.error(e.message);
      message.error("Ошибка при запросе к API");
    }

    setLoading(false);
  };

  const renderFlight = (flight: any, label: string, isReturn = false) => {
    if (!flight || !flight.origin) return null;

    return (
      <div key={label} style={{ marginBottom: 12 }}>
        
        <b>{label}</b>
        <Row style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Col>
            <p>Вылет:</p>
            <p>{getLabelByCode(flight.origin_airport || flight.origin)}</p>
            <p>{dayjs(flight.departure_at).format("DD MMM YYYY, HH:mm")}</p>
          </Col>
          <Col
            style={{ fontSize: 24, fontWeight: "bold", alignSelf: "flex-end" }}
          >
            →
          </Col>
          <Col>
            <p>Прибытие:</p>
            <p>{getLabelByCode(flight.destination_airport || flight.destination)}</p>
            <p>
              {dayjs(
                isReturn ? flight.return_at : flight.departure_at
              ).format("DD MMM YYYY, HH:mm")}
            </p>
          </Col>
        </Row>
        {/* <p>
          Рейс: {flight.airline} {flight.flight_number}
        </p> */}
        
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
                onSelect={onSelectFrom}
                placeholder="IATA код или город (например Москва (MOW))"
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
                onSelect={onSelectTo}
                placeholder="IATA код или город (например Нью-Йорк (JFK))"
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
              initialValue="economy"
              rules={[{ required: true, message: "Выберите класс перелёта" }]}
            >
              <Select>
                <Option value="economy">Эконом</Option>
                <Option value="business">Бизнес</Option>
                <Option value="first">Первый</Option>
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
        renderItem={(item, index) => (
          <List.Item key={index} style={{ width: "100%" }}>
            {renderFlight(item, "Туда")}
            {roundTrip && item.return_at && renderFlight(item, "Обратно", true)}
            <p>Цена: {item.price} USD</p>

          </List.Item>
        )}
      />
    </div>
  );
}
