// Avfrya koden i den anonyma funktionen när alla filerna laddas
window.addEventListener('load', () => {

  // Hämta en existerande HTML tagg via en referens
  const tag = (ref) => {
    return document.getElementById(ref);
  }

  // Skapa en ny HTML tagg
  const newTag = (type, parent, ref = null, content = null) => {
    const tag = document.createElement(type);
    if(ref) tag.id = ref;
    if(content) tag.textContent = content;
    parent.appendChild(tag);
    return tag;
  }

  // Spara referensa till alla HTML taggar som används i appen, inklusive de inte ännu skapade
  const REF = Object.freeze({
    PREVNAME: 'previewfullname',
    PREVEMAIL: 'previewemail',
    PREVPHONE: 'previewphone',
    NAME: 'fullname',
    EMAIL: 'email',
    PHONE: 'phone',
    FONT: 'font',
    ERR_LIST: 'errorlist',
    HISTORY: 'history',
    RECORDS: 'records',
    RES_HIST: 'res-hist',
    RES_CARD: 'clear',
    GEN_CARD: 'generate',
  });

  // Spara konstanta värden i detta omodifierbara objekt
  const VALUE = Object.freeze({
    NAME: 'Namn',
    EMAIL: 'E-post',
    PHONE: 'Telefon',
    FONT: 'Georgia',
    MIN_CHARS: 5,
    STYLED: false,
  });

  // Inkapsla logiken för student-data i denna klass
  class Student {

    // Sätt all data till utgångvärdena när student-objektet skapas
    constructor() { 
      this.reset(); 
    }

    // Uppdatera student-datan
    update = (name, email, phone, font) => {
      this.name = name;
      this.email = email;
      this.phone = phone;
      this.font = font;
      this.styled = true;
    }

    // Nollsäll student-datan till utgångsvärdena
    reset = () => {
      this.name = VALUE.NAME;
      this.email = VALUE.EMAIL;
      this.phone = VALUE.PHONE;
      this._font = VALUE.FONT;
      this.styled = VALUE.STYLED;
    }
  }

  // Inkapsla logiken för hanteringen av historik
  class Memory {
    constructor() {
      this._records = [];
      this._update();
    }

    // Hämta historikarrayen
    records = () => this._records;

    // Spara studentdatan i localStorage och cacha den i records-arrayen
    _cache = (id) => {
      const record = localStorage.getItem(id);
      this._records.push(record);
    }

    // Iterara över alla localStorage objekt och uppdatera den cachade historiken
    _update = () => {
      for(let i = 0; i < localStorage.length; i++) {
        const id = localStorage.key(i);
        this._cache(id);
      }
    }

    // Tilldela student-datan ett unikt id och spara det i form av JSON i localStorage
    save = (student) => {
      const id = crypto.randomUUID();
      const json = JSON.stringify(student);
      localStorage.setItem(id, json);
      this._cache(id);
    } 

    // Rensa localSorage minnet
    reset = () => {
      this._records = [];
      localStorage.clear();
    }
  }

  // Inkapslar logiken för hanteringen av dataverfikation
  class Verifier {

    // Skapa en datasamling över felmedelanden av typen Set (tar bort dubletterna)
    constructor() {
      this._errors = new Set();
    }

    // Omvandla set-samlingen till en array och returnera felmeddelanden
    errors = () => [...this._errors];

    // Kolla om inmatningsvärdena är giltiga och om inte lägg till ett felmeddelande till error-setet
    verify = (field, tag) => {
      const message = `${field} ska ha minst ${VALUE.MIN_CHARS} tecken!`;
      const len =  tag.value.length || 0;
      if(len < VALUE.MIN_CHARS) {
        this._errors.add(message);
      } else {
        this._errors.delete(message);
      }
    } 

    // filtera inmatningsvärdena efter deras giltighet och returnera svaret på om alla är giltiga
    accepted = (inputs) => {
      const result = inputs.filter(
        val => val.length >= VALUE.MIN_CHARS
      );
      return result.length === inputs.length;
    }

    // Rensa felmeddelanden i error-setet
    reset = () => {
      this._errors.clear();
    }
  }

  // inkapsla logiken för studentkort-vyn
  class StudCard  {

    // Spara HTML taggarna för namn, e-post och mobil
    constructor(name, email, phone) {
      this._name = name;
      this._email = email;
      this._phone = phone;
    }

    // Konfigurera namnet och teckensnittstypen för HTML taggen, eller ta bort stilen om taggen inte ska ha stil
    _render = (tag, value, font, styled) => {
      tag.textContent = value;
      if(!styled)
        return this._unstyle();
      tag.style.fontFamily = font;
    }

    // Uppdatera alla HTML taggar med den nyaste student-datan
    update = (student) => {
      const { name, email, phone, font, styled } = student;
      this._render(this._name, name, font, styled);
      this._render(this._email, email, font, styled);
      this._render(this._phone, phone, font, styled);
    }

    // Ta bort stilattributet från alla HTML taggar
    _unstyle = () => {
      const attr = 'style';
      this._name.removeAttribute(attr);
      this._email.removeAttribute(attr);
      this._phone.removeAttribute(attr);
    }
  }

  // Inkapslar logiken för felmeddelande-vyn
  class ErrCard {

    // Spara HTML taggen för listan över alla felmeddelanden
    constructor(errList) {
      this._errList = errList;
    }

    // Uppdater felmeddelande-listan genom att rensa listan och skapa en ny från den aktuella error-arrayen
    update = (verifier) => {
      this._errList.innerHTML = '';
      const errs = verifier.errors();
      errs.forEach(err => {
        const tag = newTag('li', this._errList);
        tag.textContent = err;
      });
    }

    // Rensa felmeddelanden i Verifier objektet och HTML taggen för felmeddelanden
    reset = (verifier) => {
      verifier.reset();
      this._errList.innerHTML = '';
    }
  }

  // Inkapslar logiken för historik-vyn
  class HistCard {

    // Spara HTML taggarna fär historiken, arkivalier och rensa-historik-knappen
    constructor(history, records, resHist) {
      this._history = history;
      this._records = records;
      this._records.style = 'list-style: none; padding: 0; margin: 0.2rem, 0;';
      this._resHist = resHist;
    }

    // Låt rensa-historik-knappen rensa minnet och updatera historik-vyn när den klickas
    connect = (memory) => {
      this._resHist.addEventListener('click', () => {
        memory.reset();
        this.update(memory);
      })
    }

    // Definiera en ny HTML tagg
    _addTag = (type, parent, text) => {
      const tag = newTag(type, parent);
      tag.textContent = text;
    }

    // Stilisera ett listobjekt
    _beautifyLi = (tag, font) => {
      tag.style = 'list-style: none;' +
      'border-top: gray 1px solid;' +
      'padding: 0.5rem 0;' +
      'margin: 0.3rem;' +
      `font-family: '${font}';`;
    }

    // Skapa ett listobjekt baserat på arkivaliedatan
    _render = (record) => {
      const archive = JSON.parse(record);
      const { name, email, phone, font } = archive;
      const item = newTag('li', this._records);
      this._beautifyLi(item, font);
      this._addTag('h4', item, name);
      this._addTag('p', item, `E-post: ${email}`);
      this._addTag('p', item, `Telefon ${phone}`);
    }

    // uppdatera HTML-taggen för arkivalier genom att rensa den och återskapa från det uppdaterade minnet
    update = (memory) => {
      this._records.innerHTML = '';
      const records = memory.records();
      records.forEach(record => {
        this._render(record);
      });
    }
  }

  // Inkapslar logiken för student-formuläret
  class StudForm {

    // Spara HTML taggarna för inmatningar och knappar relaterade till student-formuläret
    constructor(name, email, phone, font, genCard, resCard) {
      this._name = name;
      this._email = email;
      this._phone = phone;
      this._font = font;
      this._genCard = genCard;
      this._resCard = resCard;
    }

    //  Tilldela knapparna 'klick' händelserna
    connect = (verifier, student, memory, studCard, errCard, histCard) => {

      // Skickar formuläret och uppdaterar alla vyer som har påverkats av det
      this._genCard.addEventListener('click', () => {
        this._send(verifier, student, memory);
        errCard.update(verifier);
        studCard.update(student);
        histCard.update(memory);
      });

      // Rensar felmeddelanden, student-datan och felmeddelande-vyn samt nollställer formuläret och uppdaterar studentkortet
      this._resCard.addEventListener('click', () => {
        verifier.reset();
        student.reset();
        studCard.update(student);
        errCard.reset(verifier);
        this._reset();
      });
    }

    // Låt inmatningstaggarna lyssna efter användarinmatning och verifiera den samt uppdatera felmeddelande-vyn
    wire = (verifier, errCard) => {
      this._name.addEventListener('input', () => {
        verifier.verify(VALUE.NAME, this._name);
        errCard.update(verifier);
      });
      this._email.addEventListener('input', () => {
        verifier.verify(VALUE.EMAIL, this._email);
        errCard.update(verifier);
      });
      this._phone.addEventListener('input', () => {
        verifier.verify(VALUE.PHONE, this._phone);
        errCard.update(verifier);
      });
    }

    // Verifiera inmatningen och uppdatera student-datan samt spara den i minnet om alla fält är giltiga
    _send = (verifier, student, memory) => {
      const { verify, accepted } = verifier;
      const inputs = [
        this._name.value,
        this._email.value,
        this._phone.value
      ];
      verify(VALUE.NAME, this._name);
      verify(VALUE.EMAIL, this._email);
      verify(VALUE.PHONE, this._phone);
      if(accepted(inputs)) {
        student.update(
          this._name.value,
          this._email.value,
          this._phone.value,
          this._font.value
        );
        memory.save(student);
      }
    }

    // Nollställ formuläret
    _reset = () => {
      this._name.value = '';
      this._email.value = '';
      this._phone.value = '';
      this._font.value = VALUE.FONT;
    }
  }

  // Skapa objekt för minnet, verifikation och studentdatan
  const memory = new Memory();
  const verifier = new Verifier();
  const student = new Student();

  // Sätt upp studentkort-vyn
  const studCard = new StudCard(
    tag(REF.PREVNAME),
    tag(REF.PREVEMAIL),
    tag(REF.PREVPHONE)
  );

  // Sätt upp felmeddelande-vyn
  const errCard = new ErrCard(tag(REF.ERR_LIST));

  // Sätt upp historik-vyn
  const histCard = new HistCard(
    tag(REF.HISTORY),
    newTag('ul', tag(REF.HISTORY),REF.RECORDS),
    newTag('button', tag(REF.HISTORY), REF.RES_HIST, 'Reset History')
  );

  // Konfigurera historik-vyn och sedan uppdatera den
  histCard.connect(memory);
  histCard.update(memory);

  // Sätt upp student-formuläret
  const studForm = new StudForm(
    tag(REF.NAME),
    tag(REF.EMAIL),
    tag(REF.PHONE),
    tag(REF.FONT),
    tag(REF.GEN_CARD),
    tag(REF.RES_CARD)
  );

  // Konfigurera student-formuläret
  studForm.connect(
    verifier, 
    student, 
    memory, 
    studCard, 
    errCard, 
    histCard
  );

  // Låt inmatningstaggarna lyssna efter användarinmatning
  studForm.wire(
    verifier, 
    errCard
  );

});
